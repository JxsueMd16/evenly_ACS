import express, { Router, type Request } from "express";
import type { Pago } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { badRequest, conflict, forbidden, notFound } from "../lib/errors.js";
import { createPaymentSchema, idSchema } from "../lib/schemas.js";
import { computeNetCents } from "../lib/balances.js";
import { fromCents, toCents } from "../lib/money.js";
import { requireMembership } from "../lib/access.js";
import { notifyUsers } from "../lib/notificationHub.js";
import { currentUser } from "../middleware/auth.js";

/**
 * Pagos de deudas dentro de un grupo, en dos pasos:
 *   1. Quien debe registra el pago (efectivo o transferencia, con comprobante opcional).
 *   2. Quien recibe confirma que recibió el monto completo, o lo rechaza.
 * Solo los pagos CONFIRMADOS cambian los balances.
 *
 * Montado en /groups/:groupId/payments.
 */
export const paymentsRouter = Router({ mergeParams: true });

const groupIdOf = (req: Request) => (req.params as { groupId?: string }).groupId;
const MAX_EVIDENCE_BYTES = 3 * 1024 * 1024;

type PaymentRow = Omit<Pago, "evidencia"> & { evidencia?: unknown };

const paymentSelect = {
  id: true,
  grupoId: true,
  deudorId: true,
  acreedorId: true,
  montoCentavos: true,
  metodo: true,
  nota: true,
  evidenciaTipo: true,
  estado: true,
  createdAt: true,
  respondidoAt: true,
} as const;

function toPaymentDto(p: PaymentRow) {
  return {
    id: p.id,
    groupId: p.grupoId,
    fromUserId: p.deudorId,
    toUserId: p.acreedorId,
    amount: fromCents(p.montoCentavos),
    method: p.metodo,
    note: p.nota,
    status: p.estado,
    hasEvidence: p.evidenciaTipo !== null,
    createdAt: p.createdAt.toISOString(),
    respondedAt: p.respondidoAt?.toISOString() ?? null,
  };
}

async function findPayment(groupId: string, id: string | undefined) {
  const payment = idSchema.safeParse(id).success
    ? await prisma.pago.findFirst({ where: { id: id!, grupoId: groupId }, select: paymentSelect })
    : null;
  if (!payment) throw notFound("Pago no encontrado.");
  return payment;
}

/** Balance actual (en centavos) del usuario en el grupo, con los pagos ya confirmados. */
async function netInGroup(groupId: string, userId: string) {
  const group = await prisma.grupo.findUnique({
    where: { id: groupId },
    select: {
      miembros: { select: { usuarioId: true } },
      gastos: {
        select: { pagadoPorId: true, montoCentavos: true, items: { select: { usuarioId: true, montoCentavos: true } } },
      },
      pagos: { where: { estado: "CONFIRMADO" }, select: { deudorId: true, acreedorId: true, montoCentavos: true } },
    },
  });
  if (!group) return 0;
  return (
    computeNetCents(
      group.miembros.map((m) => m.usuarioId),
      group.gastos,
      group.pagos,
    ).get(userId) ?? 0
  );
}

const firstName = (nombre: string) => nombre.split(" ")[0];

/** GET /groups/:groupId/payments — pagos del grupo, del más reciente al más antiguo. */
paymentsRouter.get("/", async (req, res) => {
  const me = currentUser(req);
  const membership = await requireMembership(groupIdOf(req), me.id);
  const payments = await prisma.pago.findMany({
    where: { grupoId: membership.grupoId },
    select: paymentSelect,
    orderBy: { createdAt: "desc" },
  });
  res.json({ payments: payments.map(toPaymentDto) });
});

/** POST /groups/:groupId/payments — quien debe registra que pagó. */
paymentsRouter.post("/", async (req, res) => {
  const me = currentUser(req);
  const membership = await requireMembership(groupIdOf(req), me.id);
  const groupId = membership.grupoId;
  const input = createPaymentSchema.parse(req.body);

  if (input.toUserId === me.id) throw badRequest("SELF_PAYMENT", "No puedes registrarte un pago a ti mismo.");
  const receiver = await prisma.miembroGrupo.findUnique({
    where: { grupoId_usuarioId: { grupoId: groupId, usuarioId: input.toUserId } },
  });
  if (!receiver) throw badRequest("NOT_A_MEMBER", "A quien le pagas debe ser integrante del grupo.");

  const debt = -(await netInGroup(groupId, me.id));
  const cents = toCents(input.amount);
  if (debt <= 0) throw badRequest("NO_DEBT", "No tienes deudas pendientes en este grupo.");
  if (cents > debt) {
    throw badRequest("AMOUNT_EXCEEDS_DEBT", `El monto supera lo que debes en el grupo (${(debt / 100).toFixed(2)}).`);
  }

  const payment = await prisma.pago.create({
    data: {
      grupoId: groupId,
      deudorId: me.id,
      acreedorId: input.toUserId,
      montoCentavos: cents,
      metodo: input.method,
      nota: input.note || null,
    },
    select: paymentSelect,
  });

  notifyUsers(
    [input.toUserId],
    new Map([
      [
        input.toUserId,
        {
          kind: "payment-reported",
          message: `${firstName(me.nombre)} registró un pago de ${input.amount.toFixed(2)} (${input.method === "EFECTIVO" ? "efectivo" : "transferencia"}). Confírmalo cuando lo recibas.`,
          link: `/groups/${groupId}`,
        },
      ],
    ]),
  );

  res.status(201).json({ payment: toPaymentDto(payment) });
});

/**
 * POST /groups/:groupId/payments/:id/evidence — comprobante del pago (imagen
 * JPEG, PNG o WebP de hasta 3 MB, enviada como cuerpo binario). Solo quien
 * pagó y mientras el pago esté pendiente.
 */
paymentsRouter.post(
  "/:id/evidence",
  express.raw({ type: ["image/jpeg", "image/png", "image/webp"], limit: MAX_EVIDENCE_BYTES }),
  async (req, res) => {
    const me = currentUser(req);
    const membership = await requireMembership(groupIdOf(req), me.id);
    const payment = await findPayment(membership.grupoId, req.params.id);
    if (payment.deudorId !== me.id) throw forbidden("Solo quien registró el pago puede adjuntar el comprobante.");
    if (payment.estado !== "PENDIENTE") throw conflict("PAYMENT_CLOSED", "El pago ya fue confirmado o rechazado.");

    const body = req.body as unknown;
    if (!Buffer.isBuffer(body) || body.length === 0) {
      throw badRequest("INVALID_EVIDENCE", "Adjunta una imagen JPG, PNG o WebP.");
    }
    const type = detectImageType(body);
    if (!type) throw badRequest("INVALID_EVIDENCE", "El archivo no es una imagen JPG, PNG o WebP válida.");

    await prisma.pago.update({
      where: { id: payment.id },
      data: { evidencia: new Uint8Array(body), evidenciaTipo: type },
    });
    res.status(204).end();
  },
);

/** GET /groups/:groupId/payments/:id/evidence — solo quien pagó y quien recibe. */
paymentsRouter.get("/:id/evidence", async (req, res) => {
  const me = currentUser(req);
  const membership = await requireMembership(groupIdOf(req), me.id);
  const payment = await findPayment(membership.grupoId, req.params.id);
  if (payment.deudorId !== me.id && payment.acreedorId !== me.id) {
    throw forbidden("Solo quien pagó y quien recibe pueden ver el comprobante.");
  }
  const row = await prisma.pago.findUnique({ where: { id: payment.id }, select: { evidencia: true, evidenciaTipo: true } });
  if (!row?.evidencia || !row.evidenciaTipo) throw notFound("Este pago no tiene comprobante.");

  res.set({ "Content-Type": row.evidenciaTipo, "Cache-Control": "private, no-store" });
  res.send(Buffer.from(row.evidencia));
});

async function respond(req: Request, estado: "CONFIRMADO" | "RECHAZADO") {
  const me = currentUser(req);
  const membership = await requireMembership(groupIdOf(req), me.id);
  const payment = await findPayment(membership.grupoId, (req.params as { id?: string }).id);
  if (payment.acreedorId !== me.id) throw forbidden("Solo quien recibe el pago puede confirmarlo o rechazarlo.");
  if (payment.estado !== "PENDIENTE") throw conflict("PAYMENT_CLOSED", "El pago ya fue confirmado o rechazado.");

  const updated = await prisma.pago.update({
    where: { id: payment.id },
    data: { estado, respondidoAt: new Date() },
    select: paymentSelect,
  });

  const amount = fromCents(payment.montoCentavos).toFixed(2);
  notifyUsers(
    [payment.deudorId, payment.acreedorId],
    new Map([
      [
        payment.deudorId,
        estado === "CONFIRMADO"
          ? {
              kind: "payment-confirmed",
              message: `${firstName(me.nombre)} confirmó que recibió tu pago de ${amount}`,
              link: `/groups/${membership.grupoId}`,
            }
          : {
              kind: "payment-rejected",
              message: `${firstName(me.nombre)} indicó que no recibió tu pago de ${amount}`,
              link: `/groups/${membership.grupoId}`,
            },
      ],
    ]),
  );
  return toPaymentDto(updated);
}

/** POST /groups/:groupId/payments/:id/confirm — quien recibe confirma el monto completo. */
paymentsRouter.post("/:id/confirm", async (req, res) => {
  res.json({ payment: await respond(req, "CONFIRMADO") });
});

/** POST /groups/:groupId/payments/:id/reject — quien recibe indica que no lo recibió. */
paymentsRouter.post("/:id/reject", async (req, res) => {
  res.json({ payment: await respond(req, "RECHAZADO") });
});

/** DELETE /groups/:groupId/payments/:id — quien pagó cancela un pago aún pendiente. */
paymentsRouter.delete("/:id", async (req, res) => {
  const me = currentUser(req);
  const membership = await requireMembership(groupIdOf(req), me.id);
  const payment = await findPayment(membership.grupoId, req.params.id);
  if (payment.deudorId !== me.id) throw forbidden("Solo quien registró el pago puede cancelarlo.");
  if (payment.estado !== "PENDIENTE") throw conflict("PAYMENT_CLOSED", "El pago ya fue confirmado o rechazado.");
  await prisma.pago.delete({ where: { id: payment.id } });
  notifyUsers([payment.acreedorId]);
  res.status(204).end();
});

/** Identifica el tipo real de la imagen por sus primeros bytes (no por el header). */
function detectImageType(buf: Buffer): string | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "image/png";
  }
  if (buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    return "image/webp";
  }
  return null;
}
