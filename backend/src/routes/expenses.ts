import { Router, type Request } from "express";
import { prisma } from "../lib/prisma.js";
import { forbidden, notFound } from "../lib/errors.js";
import { createExpenseSchema, idSchema } from "../lib/schemas.js";
import { expenseInclude, toExpenseDto } from "../lib/dto.js";
import { createBill } from "../lib/expenseService.js";
import { requireMembership } from "../lib/access.js";
import { groupMemberIds, notifyUsers, type Notice } from "../lib/notificationHub.js";
import { currentUser } from "../middleware/auth.js";

/** Montado en /groups/:groupId/expenses. */
export const expensesRouter = Router({ mergeParams: true });

const groupIdOf = (req: Request) => (req.params as { groupId?: string }).groupId;

async function findExpenseInGroup(groupId: string, expenseId: string | undefined) {
  const expense = idSchema.safeParse(expenseId).success
    ? await prisma.gasto.findFirst({ where: { id: expenseId!, grupoId: groupId }, include: expenseInclude })
    : null;
  if (!expense) throw notFound("Gasto no encontrado.");
  return expense;
}

/** GET /groups/:groupId/expenses — del más reciente al más antiguo. */
expensesRouter.get("/", async (req, res) => {
  const me = currentUser(req);
  const membership = await requireMembership(groupIdOf(req), me.id);
  const expenses = await prisma.gasto.findMany({
    where: { grupoId: membership.grupoId },
    include: expenseInclude,
    orderBy: { createdAt: "desc" },
  });
  res.json({ expenses: expenses.map(toExpenseDto) });
});

/** POST /groups/:groupId/expenses */
expensesRouter.post("/", async (req, res) => {
  const me = currentUser(req);
  const membership = await requireMembership(groupIdOf(req), me.id);
  const groupId = membership.grupoId;
  const input = createExpenseSchema.parse(req.body);

  const memberIds = new Set(await groupMemberIds(groupId));
  const expense = await createBill(prisma, { groupId, creatorId: me.id, memberIds, input });
  const participantIds = expense.items.map((i) => i.usuarioId);

  // Aviso inmediato a quienes participan en el gasto (menos quien lo registró).
  const group = await prisma.grupo.findUnique({ where: { id: groupId }, select: { nombre: true } });
  const notice: Notice = {
    kind: "expense-added",
    message: `${me.nombre.split(" ")[0]} registró "${expense.descripcion}" en ${group?.nombre ?? "tu grupo"}`,
    link: `/groups/${groupId}`,
  };
  notifyUsers(
    memberIds,
    new Map(participantIds.filter((id) => id !== me.id).map((id) => [id, notice])),
  );

  res.status(201).json({ expense: toExpenseDto(expense) });
});

/** GET /groups/:groupId/expenses/:expenseId */
expensesRouter.get("/:expenseId", async (req, res) => {
  const me = currentUser(req);
  const membership = await requireMembership(groupIdOf(req), me.id);
  const expense = await findExpenseInGroup(membership.grupoId, req.params.expenseId);
  res.json({ expense: toExpenseDto(expense) });
});

/** DELETE /groups/:groupId/expenses/:expenseId — quien lo creó, quien pagó o el administrador. */
expensesRouter.delete("/:expenseId", async (req, res) => {
  const me = currentUser(req);
  const membership = await requireMembership(groupIdOf(req), me.id);
  const expense = await findExpenseInGroup(membership.grupoId, req.params.expenseId);

  const allowed = expense.creadoPorId === me.id || expense.pagadoPorId === me.id || membership.rol === "ADMIN";
  if (!allowed) throw forbidden("Solo quien registró o pagó el gasto, o el administrador, puede eliminarlo.");

  await prisma.gasto.delete({ where: { id: expense.id } });
  notifyUsers(await groupMemberIds(membership.grupoId));
  res.status(204).end();
});
