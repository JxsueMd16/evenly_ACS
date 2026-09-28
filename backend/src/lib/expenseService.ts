/**
 * Creación de cuentas (gastos), compartida por las cuentas de grupo y las
 * cuentas rápidas. Valida integrantes, calcula el reparto con computeBill y
 * guarda la cuenta con sus líneas, asignaciones y la parte de cada persona.
 */
import type { Prisma, PrismaClient } from "../generated/prisma/client.js";
import { badRequest } from "./errors.js";
import { BillError, computeBill } from "./bill.js";
import { expenseInclude } from "./dto.js";
import { toCents } from "./money.js";
import type { CreateExpenseInput } from "./schemas.js";

type Db = PrismaClient | Prisma.TransactionClient;

export async function createBill(
  db: Db,
  { groupId, creatorId, memberIds, input }: { groupId: string; creatorId: string; memberIds: Set<string>; input: CreateExpenseInput },
) {
  if (!memberIds.has(input.paidById)) {
    throw badRequest("NOT_A_MEMBER", "Quien pagó debe ser integrante del grupo.");
  }
  const participantIds = input.participants.map((p) => p.userId);
  if (participantIds.some((id) => !memberIds.has(id))) {
    throw badRequest("NOT_A_MEMBER", "Todos los participantes deben ser integrantes del grupo.");
  }

  let bill;
  try {
    bill = computeBill({
      splitType: input.splitType,
      participantIds,
      amountCents: input.amount === undefined ? undefined : toCents(input.amount),
      lines: input.lines.map((l) => ({
        description: l.description,
        quantity: l.quantity,
        unitPriceCents: toCents(l.unitPrice),
        shared: l.shared,
        assignments: l.assignments,
      })),
      manualShares: input.participants.map((p) => ({
        userId: p.userId,
        cents: p.amount === undefined ? undefined : toCents(p.amount),
      })),
    });
  } catch (err) {
    if (err instanceof BillError) throw badRequest(err.code, err.message);
    throw err;
  }

  // Las asignaciones por unidades solo se guardan en división por ítems.
  const keepAssignments = input.splitType === "items";

  return db.gasto.create({
    data: {
      grupoId: groupId,
      descripcion: input.description,
      montoCentavos: bill.totalCents,
      categoria: input.category,
      tipoDivision: input.splitType,
      pagadoPorId: input.paidById,
      creadoPorId: creatorId,
      items: { create: bill.shares.map((s) => ({ usuarioId: s.userId, montoCentavos: s.cents })) },
      lineas: {
        create: input.lines.map((l, index) => ({
          orden: index,
          descripcion: l.description,
          cantidad: l.quantity,
          precioUnitarioCentavos: toCents(l.unitPrice),
          compartido: l.shared,
          asignaciones: {
            create: keepAssignments ? l.assignments.map((a) => ({ usuarioId: a.userId, cantidad: l.shared ? 1 : a.quantity })) : [],
          },
        })),
      },
    },
    include: expenseInclude,
  });
}
