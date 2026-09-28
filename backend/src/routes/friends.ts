import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { badRequest, conflict, forbidden, notFound } from "../lib/errors.js";
import { friendRequestSchema, idSchema } from "../lib/schemas.js";
import { publicUserSelect, toUserDto } from "../lib/dto.js";
import { findFriendship } from "../lib/friendships.js";
import { notifyUsers } from "../lib/notificationHub.js";
import { currentUser } from "../middleware/auth.js";

export const friendsRouter = Router();

/**
 * GET /friends — amigos aceptados y solicitudes pendientes (recibidas y enviadas).
 */
friendsRouter.get("/", async (req, res) => {
  const me = currentUser(req);
  const rows = await prisma.amistad.findMany({
    where: { OR: [{ solicitanteId: me.id }, { destinatarioId: me.id }] },
    include: { solicitante: { select: publicUserSelect }, destinatario: { select: publicUserSelect } },
    orderBy: { createdAt: "desc" },
  });

  const friends = [];
  const incoming = [];
  const outgoing = [];
  for (const row of rows) {
    const sentByMe = row.solicitanteId === me.id;
    const other = toUserDto(sentByMe ? row.destinatario : row.solicitante);
    if (row.estado === "ACEPTADA") friends.push(other);
    else if (sentByMe) outgoing.push({ id: row.id, user: other, createdAt: row.createdAt.toISOString() });
    else incoming.push({ id: row.id, user: other, createdAt: row.createdAt.toISOString() });
  }
  friends.sort((a, b) => a.name.localeCompare(b.name, "es"));

  res.json({ friends, incoming, outgoing });
});

/**
 * POST /friends/requests — envía una solicitud. Si el otro usuario ya me había
 * enviado una, se acepta directamente (los dos quieren ser amigos).
 */
friendsRouter.post("/requests", async (req, res) => {
  const me = currentUser(req);
  const { userId } = friendRequestSchema.parse(req.body);
  if (userId === me.id) throw badRequest("SELF_FRIENDSHIP", "No puedes enviarte una solicitud a ti mismo.");

  const target = await prisma.usuario.findUnique({ where: { id: userId }, select: { id: true } });
  if (!target) throw notFound("El usuario no existe.");

  const existing = await findFriendship(me.id, userId);
  if (existing?.estado === "ACEPTADA") throw conflict("ALREADY_FRIENDS", "Ya son amigos.");
  if (existing && existing.solicitanteId === me.id) {
    throw conflict("REQUEST_PENDING", "Ya le enviaste una solicitud a este usuario.");
  }
  if (existing) {
    await prisma.amistad.update({
      where: { id: existing.id },
      data: { estado: "ACEPTADA", respondedAt: new Date() },
    });
    notifyUsers(
      [me.id, userId],
      new Map([[userId, { kind: "friend-accepted", message: `${me.nombre} aceptó tu solicitud de amistad`, link: "/friends" }]]),
    );
    res.status(200).json({ status: "friends" });
    return;
  }

  await prisma.amistad.create({ data: { solicitanteId: me.id, destinatarioId: userId } });
  notifyUsers(
    [userId],
    new Map([[userId, { kind: "friend-request", message: `${me.nombre} te envió una solicitud de amistad`, link: "/friends" }]]),
  );
  res.status(201).json({ status: "outgoing" });
});

async function findRequest(id: string | undefined) {
  const request = idSchema.safeParse(id).success ? await prisma.amistad.findUnique({ where: { id: id! } }) : null;
  if (!request) throw notFound("Solicitud no encontrada.");
  return request;
}

/** POST /friends/requests/:id/accept — solo quien recibió la solicitud. */
friendsRouter.post("/requests/:id/accept", async (req, res) => {
  const me = currentUser(req);
  const request = await findRequest(req.params.id);
  if (request.solicitanteId !== me.id && request.destinatarioId !== me.id) throw notFound("Solicitud no encontrada.");
  if (request.destinatarioId !== me.id) throw forbidden("Solo quien recibe la solicitud puede aceptarla.");
  if (request.estado === "ACEPTADA") throw conflict("ALREADY_FRIENDS", "Ya son amigos.");

  await prisma.amistad.update({ where: { id: request.id }, data: { estado: "ACEPTADA", respondedAt: new Date() } });
  notifyUsers(
    [me.id, request.solicitanteId],
    new Map([
      [
        request.solicitanteId,
        { kind: "friend-accepted", message: `${me.nombre} aceptó tu solicitud de amistad`, link: "/friends" },
      ],
    ]),
  );
  res.json({ status: "friends" });
});

/** DELETE /friends/requests/:id — quien la recibió la rechaza o quien la envió la cancela. */
friendsRouter.delete("/requests/:id", async (req, res) => {
  const me = currentUser(req);
  const request = await findRequest(req.params.id);
  if (request.solicitanteId !== me.id && request.destinatarioId !== me.id) throw notFound("Solicitud no encontrada.");
  if (request.estado === "ACEPTADA") {
    throw conflict("ALREADY_FRIENDS", "La solicitud ya fue aceptada; elimina la amistad en su lugar.");
  }

  await prisma.amistad.delete({ where: { id: request.id } });
  notifyUsers([request.solicitanteId, request.destinatarioId]);
  res.status(204).end();
});

/** DELETE /friends/:userId — elimina la amistad (no afecta los grupos en común). */
friendsRouter.delete("/:userId", async (req, res) => {
  const me = currentUser(req);
  const userId = req.params.userId;
  if (!idSchema.safeParse(userId).success) throw notFound("No son amigos.");

  const friendship = await findFriendship(me.id, userId);
  if (!friendship || friendship.estado !== "ACEPTADA") throw notFound("No son amigos.");

  await prisma.amistad.delete({ where: { id: friendship.id } });
  res.status(204).end();
});
