import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { AppError, badRequest } from "../lib/errors.js";
import { remindSchema } from "../lib/schemas.js";
import { debtsOf, nextReminderAt, type Debt } from "../lib/debts.js";
import { fromCents } from "../lib/money.js";
import { publicUserSelect, toUserDto } from "../lib/dto.js";
import { requireMembership } from "../lib/access.js";
import { notifyUsers, type Notice } from "../lib/notificationHub.js";
import { currentUser } from "../middleware/auth.js";

export const debtsRouter = Router();

const debtGroupSelect = {
  id: true,
  nombre: true,
  esRapida: true,
  miembros: { select: { usuarioId: true, usuario: { select: publicUserSelect } } },
  gastos: {
    select: { pagadoPorId: true, montoCentavos: true, items: { select: { usuarioId: true, montoCentavos: true } } },
  },
  pagos: { where: { estado: "CONFIRMADO" }, select: { deudorId: true, acreedorId: true, montoCentavos: true } },
} as const;

async function loadDebts(userId: string, groupId?: string) {
  const groups = await prisma.grupo.findMany({
    where: { ...(groupId && { id: groupId }), miembros: { some: { usuarioId: userId } } },
    select: debtGroupSelect,
  });
  const debts = debtsOf(
    userId,
    groups.map((g) => ({
      id: g.id,
      memberIds: g.miembros.map((m) => m.usuarioId),
      expenses: g.gastos,
      payments: g.pagos,
    })),
  );
  return { groups, debts };
}

/**
 * GET /debts — lo que el usuario debe y lo que le deben, por persona y grupo
 * (los mismos pagos sugeridos que muestra cada grupo). En "owedToMe" incluye
 * `canRemindAt`: null si ya puede enviar un recordatorio, o cuándo podrá.
 */
debtsRouter.get("/", async (req, res) => {
  const me = currentUser(req);
  const { groups, debts } = await loadDebts(me.id);

  const reminders = await prisma.recordatorioCobro.groupBy({
    by: ["grupoId", "deudorId"],
    where: { acreedorId: me.id },
    _max: { createdAt: true },
  });
  const lastReminder = new Map(reminders.map((r) => [`${r.grupoId}:${r.deudorId}`, r._max.createdAt]));

  const toDto = (d: Debt) => {
    const group = groups.find((g) => g.id === d.groupId)!;
    const user = group.miembros.find((m) => m.usuarioId === d.userId)!.usuario;
    return {
      group: { id: group.id, name: group.nombre, isQuick: group.esRapida },
      user: toUserDto(user),
      amount: fromCents(d.cents),
    };
  };

  res.json({
    owe: debts.owe.map(toDto),
    owedToMe: debts.owedToMe.map((d) => ({
      ...toDto(d),
      canRemindAt: nextReminderAt(lastReminder.get(`${d.groupId}:${d.userId}`))?.toISOString() ?? null,
    })),
  });
});

/**
 * POST /debts/remind — { groupId, userId }: le recuerda a `userId` que le debe
 * al usuario en ese grupo. Solo si de verdad le debe (pagos sugeridos del
 * grupo) y como máximo una vez cada 24 horas por deuda.
 */
debtsRouter.post("/remind", async (req, res) => {
  const me = currentUser(req);
  const input = remindSchema.parse(req.body);
  await requireMembership(input.groupId, me.id);

  const { groups, debts } = await loadDebts(me.id, input.groupId);
  const debt = debts.owedToMe.find((d) => d.userId === input.userId);
  if (!debt) throw badRequest("NO_DEBT", "Esa persona no te debe nada en este grupo.");

  const last = await prisma.recordatorioCobro.findFirst({
    where: { grupoId: input.groupId, acreedorId: me.id, deudorId: input.userId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  const blockedUntil = nextReminderAt(last?.createdAt);
  if (blockedUntil) {
    throw new AppError(429, "REMINDER_TOO_SOON", "Ya le enviaste un recordatorio. Podrás enviar otro en 24 horas.", {
      canRemindAt: blockedUntil.toISOString(),
    });
  }

  const reminder = await prisma.recordatorioCobro.create({
    data: { grupoId: input.groupId, acreedorId: me.id, deudorId: input.userId },
  });

  const group = groups[0]!;
  const amount = fromCents(debt.cents).toFixed(2);
  const notice: Notice = {
    kind: "payment-reminder",
    message: `${me.nombre.split(" ")[0]} te recuerda que le debes Q ${amount} (${group.esRapida ? "cuenta" : group.nombre})`,
    link: `/groups/${group.id}`,
  };
  notifyUsers([input.userId], new Map([[input.userId, notice]]));

  res.status(201).json({ canRemindAt: nextReminderAt(reminder.createdAt)!.toISOString() });
});
