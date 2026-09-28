import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { idSchema, userSearchSchema } from "../lib/schemas.js";
import { notFound } from "../lib/errors.js";
import { canSeePaymentInfo, toBankAccountDto } from "../lib/paymentInfo.js";
import { publicUserSelect, toUserDto } from "../lib/dto.js";
import { friendshipsWith } from "../lib/friendships.js";
import { currentUser } from "../middleware/auth.js";

export const usersRouter = Router();

/**
 * GET /users?search=ana — busca usuarios por nombre o correo (para agregarlos
 * como amigos o a un grupo). Cada resultado indica la relación con el usuario
 * actual: none | friends | outgoing | incoming.
 */
usersRouter.get("/", async (req, res) => {
  const me = currentUser(req);
  const { search: rawSearch } = userSearchSchema.parse(req.query);

  // Prisma parametriza la consulta (no hay inyección SQL), pero `contains` usa
  // LIKE: sin escapar, "%%" o "__" listaban a todos los usuarios (DEF-002).
  const search = rawSearch.replace(/[\\%_]/g, "\\$&");

  const users = await prisma.usuario.findMany({
    where: {
      id: { not: me.id },
      OR: [
        { nombre: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    },
    select: publicUserSelect,
    orderBy: { nombre: "asc" },
    take: 10,
  });

  const relations = await friendshipsWith(
    me.id,
    users.map((u) => u.id),
  );
  res.json({
    users: users.map((u) => {
      const relation = relations.get(u.id);
      return { ...toUserDto(u), friendship: relation?.status ?? "none", requestId: relation?.requestId ?? null };
    }),
  });
});

/**
 * GET /users/:id/payment-info — cómo prefiere que le paguen y sus cuentas
 * bancarias visibles. Solo para quien comparte un grupo o una amistad con él
 * (a los demás se les responde 404, como si no existiera).
 */
usersRouter.get("/:id/payment-info", async (req, res) => {
  const me = currentUser(req);
  const ownerId = req.params.id;
  if (!idSchema.safeParse(ownerId).success || !(await canSeePaymentInfo(me.id, ownerId))) {
    throw notFound("Usuario no encontrado.");
  }
  const owner = await prisma.usuario.findUnique({
    where: { id: ownerId },
    select: {
      id: true,
      nombre: true,
      preferenciaPago: true,
      cuentasBancarias: { where: { visible: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!owner) throw notFound("Usuario no encontrado.");
  res.json({
    userId: owner.id,
    name: owner.nombre,
    preference: owner.preferenciaPago,
    accounts: owner.cuentasBancarias.map(toBankAccountDto),
  });
});
