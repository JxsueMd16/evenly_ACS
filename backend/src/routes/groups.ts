import { randomBytes } from "node:crypto";
import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { badRequest, conflict, forbidden, notFound } from "../lib/errors.js";
import { addMemberSchema, createGroupSchema, idSchema, updateGroupSchema } from "../lib/schemas.js";
import { publicUserSelect, toUserDto } from "../lib/dto.js";
import { computeNetCents, suggestSettlements } from "../lib/balances.js";
import { fromCents } from "../lib/money.js";
import { requireAdmin, requireMembership } from "../lib/access.js";
import { groupMemberIds, notifyUsers, type Notice } from "../lib/notificationHub.js";
import { currentUser } from "../middleware/auth.js";

export const groupsRouter = Router();

const THEME_BY_CATEGORY = {
  grupo: "ice",
  comida: "pink",
  amigos: "sky",
  transporte: "ice",
  entretenimiento: "pink",
} as const;

const groupInclude = {
  miembros: {
    include: { usuario: { select: publicUserSelect } },
    orderBy: { joinedAt: "asc" },
  },
  gastos: {
    select: { pagadoPorId: true, montoCentavos: true, items: { select: { usuarioId: true, montoCentavos: true } } },
  },
  pagos: {
    where: { estado: "CONFIRMADO" },
    select: { deudorId: true, acreedorId: true, montoCentavos: true },
  },
} as const;

async function loadGroup(groupId: string) {
  const group = await prisma.grupo.findUnique({ where: { id: groupId }, include: groupInclude });
  if (!group) throw notFound("Grupo no encontrado.");
  return group;
}

type LoadedGroup = Awaited<ReturnType<typeof loadGroup>>;

function toGroupDto(group: LoadedGroup, viewerId: string) {
  const memberIds = group.miembros.map((m) => m.usuarioId);
  const net = computeNetCents(memberIds, group.gastos, group.pagos);
  return {
    id: group.id,
    name: group.nombre,
    category: group.categoria,
    theme: group.tema,
    isQuick: group.esRapida,
    createdById: group.creadoPorId,
    createdAt: group.createdAt.toISOString(),
    memberIds,
    members: group.miembros.map((m) => ({ ...toUserDto(m.usuario), role: m.rol })),
    myBalance: fromCents(net.get(viewerId) ?? 0),
    expenseCount: group.gastos.length,
    totalSpent: fromCents(group.gastos.reduce((sum, g) => sum + g.montoCentavos, 0)),
  };
}

function toGroupDetailDto(group: LoadedGroup, viewerId: string) {
  const net = computeNetCents(
    group.miembros.map((m) => m.usuarioId),
    group.gastos,
    group.pagos,
  );
  return {
    ...toGroupDto(group, viewerId),
    balances: [...net].map(([userId, cents]) => ({ userId, net: fromCents(cents) })),
    settlements: suggestSettlements(net).map((s) => ({
      fromUserId: s.fromUserId,
      toUserId: s.toUserId,
      amount: fromCents(s.cents),
    })),
  };
}

/** GET /groups — grupos del usuario autenticado, del más reciente al más antiguo. */
groupsRouter.get("/", async (req, res) => {
  const me = currentUser(req);
  const groups = await prisma.grupo.findMany({
    where: { miembros: { some: { usuarioId: me.id } } },
    include: groupInclude,
    orderBy: { createdAt: "desc" },
  });
  res.json({ groups: groups.map((g) => toGroupDto(g, me.id)) });
});

/** POST /groups — crea un grupo; el creador queda como ADMIN. */
groupsRouter.post("/", async (req, res) => {
  const me = currentUser(req);
  const input = createGroupSchema.parse(req.body);

  const otherIds = [...new Set(input.memberIds)].filter((id) => id !== me.id);
  if (otherIds.length > 0) {
    const found = await prisma.usuario.count({ where: { id: { in: otherIds } } });
    if (found !== otherIds.length) throw badRequest("USER_NOT_FOUND", "Uno o más integrantes no existen.");
  }

  const created = await prisma.grupo.create({
    data: {
      nombre: input.name,
      categoria: input.category,
      tema: input.theme ?? THEME_BY_CATEGORY[input.category],
      creadoPorId: me.id,
      miembros: {
        create: [
          { usuarioId: me.id, rol: "ADMIN" },
          ...otherIds.map((usuarioId) => ({ usuarioId, rol: "MIEMBRO" as const })),
        ],
      },
    },
  });

  const addedNotice: Notice = {
    kind: "group-added",
    message: `${me.nombre.split(" ")[0]} te agregó al grupo "${created.nombre}"`,
    link: `/groups/${created.id}`,
  };
  notifyUsers(otherIds, new Map(otherIds.map((id) => [id, addedNotice])));

  res.status(201).json({ group: toGroupDetailDto(await loadGroup(created.id), me.id) });
});

/** GET /groups/:groupId — detalle con integrantes, balances y pagos sugeridos. */
groupsRouter.get("/:groupId", async (req, res) => {
  const me = currentUser(req);
  await requireMembership(req.params.groupId, me.id);
  res.json({ group: toGroupDetailDto(await loadGroup(req.params.groupId), me.id) });
});

/** PATCH /groups/:groupId — solo el administrador. */
groupsRouter.patch("/:groupId", async (req, res) => {
  const me = currentUser(req);
  await requireAdmin(req.params.groupId, me.id);
  const input = updateGroupSchema.parse(req.body);

  await prisma.grupo.update({
    where: { id: req.params.groupId },
    data: {
      ...(input.name !== undefined && { nombre: input.name }),
      ...(input.category !== undefined && { categoria: input.category }),
      ...(input.theme !== undefined && { tema: input.theme }),
    },
  });
  res.json({ group: toGroupDetailDto(await loadGroup(req.params.groupId), me.id) });
});

/** DELETE /groups/:groupId — solo el administrador; borra también sus gastos. */
groupsRouter.delete("/:groupId", async (req, res) => {
  const me = currentUser(req);
  await requireAdmin(req.params.groupId, me.id);
  const memberIds = await groupMemberIds(req.params.groupId);
  await prisma.grupo.delete({ where: { id: req.params.groupId } });
  notifyUsers(memberIds);
  res.status(204).end();
});

/** Código aleatorio de 12 caracteres URL-safe (72 bits de entropía). */
const newInviteCode = () => randomBytes(9).toString("base64url");

/**
 * GET /groups/:groupId/invite — cualquier integrante obtiene el código del
 * enlace de invitación; se crea la primera vez que alguien lo pide.
 */
groupsRouter.get("/:groupId/invite", async (req, res) => {
  const me = currentUser(req);
  await requireMembership(req.params.groupId, me.id);
  const group = await prisma.grupo.findUnique({ where: { id: req.params.groupId }, select: { codigoInvitacion: true } });
  const code =
    group?.codigoInvitacion ??
    (
      await prisma.grupo.update({
        where: { id: req.params.groupId },
        data: { codigoInvitacion: newInviteCode() },
        select: { codigoInvitacion: true },
      })
    ).codigoInvitacion!;
  res.json({ code });
});

/** POST /groups/:groupId/invite — el admin genera un enlace nuevo; el anterior deja de funcionar. */
groupsRouter.post("/:groupId/invite", async (req, res) => {
  const me = currentUser(req);
  await requireAdmin(req.params.groupId, me.id);
  const { codigoInvitacion } = await prisma.grupo.update({
    where: { id: req.params.groupId },
    data: { codigoInvitacion: newInviteCode() },
    select: { codigoInvitacion: true },
  });
  res.status(201).json({ code: codigoInvitacion });
});

/** POST /groups/:groupId/members — el administrador agrega a un usuario existente. */
groupsRouter.post("/:groupId/members", async (req, res) => {
  const me = currentUser(req);
  await requireAdmin(req.params.groupId, me.id);
  const { userId } = addMemberSchema.parse(req.body);

  const user = await prisma.usuario.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) throw notFound("El usuario no existe.");

  const already = await prisma.miembroGrupo.findUnique({
    where: { grupoId_usuarioId: { grupoId: req.params.groupId, usuarioId: userId } },
  });
  if (already) throw conflict("ALREADY_MEMBER", "Ese usuario ya es integrante del grupo.");

  await prisma.miembroGrupo.create({ data: { grupoId: req.params.groupId, usuarioId: userId } });
  const updated = await loadGroup(req.params.groupId);
  notifyUsers(
    [userId],
    new Map([
      [
        userId,
        {
          kind: "group-added",
          message: `${me.nombre.split(" ")[0]} te agregó al grupo "${updated.nombre}"`,
          link: `/groups/${updated.id}`,
        },
      ],
    ]),
  );
  res.status(201).json({ group: toGroupDetailDto(updated, me.id) });
});

/**
 * DELETE /groups/:groupId/members/:userId — el administrador saca a alguien o
 * un integrante sale del grupo. No se permite si participa en algún gasto.
 */
groupsRouter.delete("/:groupId/members/:userId", async (req, res) => {
  const me = currentUser(req);
  const myMembership = await requireMembership(req.params.groupId, me.id);
  const targetId = req.params.userId;
  if (!idSchema.safeParse(targetId).success) throw notFound("El integrante no existe en este grupo.");

  const isSelf = targetId === me.id;
  if (!isSelf && myMembership.rol !== "ADMIN") {
    throw forbidden("Solo el administrador puede sacar a otros integrantes.");
  }
  if (isSelf && myMembership.rol === "ADMIN") {
    throw conflict("ADMIN_CANNOT_LEAVE", "El administrador no puede salir del grupo; puede eliminarlo.");
  }

  const group = await loadGroup(req.params.groupId);
  const target = group.miembros.find((m) => m.usuarioId === targetId);
  if (!target) throw notFound("El integrante no existe en este grupo.");

  // Si sale alguien que pagó o participa en gastos, los balances del grupo
  // dejarían de cuadrar; por ahora se bloquea (no hay registro de pagos).
  const involved = group.gastos.some(
    (g) => g.pagadoPorId === targetId || g.items.some((i) => i.usuarioId === targetId),
  );
  if (involved) {
    throw conflict("MEMBER_HAS_EXPENSES", "El integrante participa en gastos del grupo y no se puede quitar.");
  }

  await prisma.miembroGrupo.delete({ where: { id: target.id } });
  res.status(204).end();
});
