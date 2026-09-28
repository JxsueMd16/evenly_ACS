import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { badRequest } from "../lib/errors.js";
import { quickBillSchema } from "../lib/schemas.js";
import { toExpenseDto } from "../lib/dto.js";
import { createBill } from "../lib/expenseService.js";
import { notifyUsers, type Notice } from "../lib/notificationHub.js";
import { currentUser } from "../middleware/auth.js";

export const quickBillsRouter = Router();

const THEME_BY_CATEGORY = {
  grupo: "ice",
  comida: "pink",
  amigos: "sky",
  transporte: "ice",
  entretenimiento: "pink",
} as const;

/**
 * POST /quick-bills — cuenta rápida sin armar un grupo antes. Crea un grupo
 * marcado como "rápido" (con el nombre de la cuenta) con el usuario actual
 * como admin y las personas indicadas, y registra la cuenta. Todo o nada:
 * si la cuenta no es válida, tampoco se crea el grupo.
 */
quickBillsRouter.post("/", async (req, res) => {
  const me = currentUser(req);
  const { participantIds, bill } = quickBillSchema.parse(req.body);

  const others = [...new Set(participantIds)].filter((id) => id !== me.id);
  if (others.length === 0) throw badRequest("NO_PARTICIPANTS", "Agrega al menos a otra persona a la cuenta.");
  const found = await prisma.usuario.count({ where: { id: { in: others } } });
  if (found !== others.length) throw badRequest("USER_NOT_FOUND", "Una o más personas no existen.");

  const { groupId, expense } = await prisma.$transaction(async (tx) => {
    const group = await tx.grupo.create({
      data: {
        nombre: bill.description,
        categoria: bill.category,
        tema: THEME_BY_CATEGORY[bill.category],
        esRapida: true,
        creadoPorId: me.id,
        miembros: {
          create: [
            { usuarioId: me.id, rol: "ADMIN" },
            ...others.map((usuarioId) => ({ usuarioId, rol: "MIEMBRO" as const })),
          ],
        },
      },
    });
    const expense = await createBill(tx, {
      groupId: group.id,
      creatorId: me.id,
      memberIds: new Set([me.id, ...others]),
      input: bill,
    });
    return { groupId: group.id, expense };
  });

  const notice: Notice = {
    kind: "expense-added",
    message: `${me.nombre.split(" ")[0]} te incluyó en la cuenta "${bill.description}"`,
    link: `/groups/${groupId}`,
  };
  notifyUsers(others, new Map(others.map((id) => [id, notice])));

  res.status(201).json({ groupId, expense: toExpenseDto(expense) });
});
