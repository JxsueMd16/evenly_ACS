import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { activityQuerySchema } from "../lib/schemas.js";
import { expenseInclude, toExpenseDto } from "../lib/dto.js";
import { currentUser } from "../middleware/auth.js";

export const activityRouter = Router();

/**
 * GET /activity?limit=20&paidByMe=false
 * Gastos recientes de todos los grupos del usuario. Con paidByMe=true solo
 * los que pagó él (historial de pagos del perfil).
 */
activityRouter.get("/", async (req, res) => {
  const me = currentUser(req);
  const query = activityQuerySchema.parse(req.query);

  const expenses = await prisma.gasto.findMany({
    where: {
      grupo: { miembros: { some: { usuarioId: me.id } } },
      ...(query.paidByMe === "true" && { pagadoPorId: me.id }),
    },
    include: { ...expenseInclude, grupo: { select: { id: true, nombre: true, categoria: true, tema: true } } },
    orderBy: { createdAt: "desc" },
    take: query.limit,
  });

  res.json({
    items: expenses.map((e) => ({
      expense: toExpenseDto(e),
      group: { id: e.grupo.id, name: e.grupo.nombre, category: e.grupo.categoria, theme: e.grupo.tema },
    })),
  });
});
