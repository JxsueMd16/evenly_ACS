import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { badRequest, notFound } from "../lib/errors.js";
import { bankAccountSchema, idSchema, paymentPreferenceSchema, updateBankAccountSchema } from "../lib/schemas.js";
import { toBankAccountDto } from "../lib/paymentInfo.js";
import { currentUser } from "../middleware/auth.js";

export const meRouter = Router();

const MAX_ACCOUNTS = 10;

/** GET /me/payment-profile — preferencia de pago y todas mis cuentas (también las privadas). */
meRouter.get("/payment-profile", async (req, res) => {
  const me = currentUser(req);
  const [user, accounts] = await Promise.all([
    prisma.usuario.findUnique({ where: { id: me.id }, select: { preferenciaPago: true } }),
    prisma.cuentaBancaria.findMany({ where: { usuarioId: me.id }, orderBy: { createdAt: "asc" } }),
  ]);
  res.json({ preference: user?.preferenciaPago ?? "AMBOS", accounts: accounts.map(toBankAccountDto) });
});

/** PATCH /me/payment-profile — cambia la preferencia de pago. */
meRouter.patch("/payment-profile", async (req, res) => {
  const me = currentUser(req);
  const { preference } = paymentPreferenceSchema.parse(req.body);
  await prisma.usuario.update({ where: { id: me.id }, data: { preferenciaPago: preference } });
  res.json({ preference });
});

/** POST /me/bank-accounts — agrega una cuenta bancaria. */
meRouter.post("/bank-accounts", async (req, res) => {
  const me = currentUser(req);
  const input = bankAccountSchema.parse(req.body);
  const count = await prisma.cuentaBancaria.count({ where: { usuarioId: me.id } });
  if (count >= MAX_ACCOUNTS) throw badRequest("TOO_MANY_ACCOUNTS", `Puedes registrar hasta ${MAX_ACCOUNTS} cuentas.`);

  const account = await prisma.cuentaBancaria.create({
    data: {
      usuarioId: me.id,
      banco: input.bank,
      tipo: input.type,
      numero: input.number,
      titular: input.holder,
      visible: input.visible,
    },
  });
  res.status(201).json({ account: toBankAccountDto(account) });
});

async function findMyAccount(userId: string, id: string | undefined) {
  const account = idSchema.safeParse(id).success
    ? await prisma.cuentaBancaria.findFirst({ where: { id: id!, usuarioId: userId } })
    : null;
  if (!account) throw notFound("Cuenta bancaria no encontrada.");
  return account;
}

/** PATCH /me/bank-accounts/:id — editar datos o visibilidad. */
meRouter.patch("/bank-accounts/:id", async (req, res) => {
  const me = currentUser(req);
  const account = await findMyAccount(me.id, req.params.id);
  const input = updateBankAccountSchema.parse(req.body);
  const updated = await prisma.cuentaBancaria.update({
    where: { id: account.id },
    data: {
      ...(input.bank !== undefined && { banco: input.bank }),
      ...(input.type !== undefined && { tipo: input.type }),
      ...(input.number !== undefined && { numero: input.number }),
      ...(input.holder !== undefined && { titular: input.holder }),
      ...(input.visible !== undefined && { visible: input.visible }),
    },
  });
  res.json({ account: toBankAccountDto(updated) });
});

/** DELETE /me/bank-accounts/:id */
meRouter.delete("/bank-accounts/:id", async (req, res) => {
  const me = currentUser(req);
  const account = await findMyAccount(me.id, req.params.id);
  await prisma.cuentaBancaria.delete({ where: { id: account.id } });
  res.status(204).end();
});
