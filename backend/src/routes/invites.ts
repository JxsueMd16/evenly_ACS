import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { notFound } from "../lib/errors.js";
import { inviteCodeSchema } from "../lib/schemas.js";
import { currentUser } from "../middleware/auth.js";

export const invitesRouter = Router();

const INVALID_INVITE = "Este enlace de invitación no es válido o ya fue reemplazado.";

async function findGroupByCode(code: string | undefined) {
  const group = inviteCodeSchema.safeParse(code).success
    ? await prisma.grupo.findUnique({
        where: { codigoInvitacion: code! },
        include: {
          miembros: { include: { usuario: { select: { id: true, nombre: true } } }, orderBy: { joinedAt: "asc" } },
        },
      })
    : null;
  if (!group) throw notFound(INVALID_INVITE);
  return group;
}

/**
 * GET /invites/:code — vista previa del grupo para quien abre el enlace.
 * Solo muestra el nombre del grupo y el nombre de pila de los integrantes
 * (no correos ni montos).
 */
invitesRouter.get("/:code", async (req, res) => {
  const me = currentUser(req);
  const group = await findGroupByCode(req.params.code);
  res.json({
    group: {
      id: group.id,
      name: group.nombre,
      category: group.categoria,
      theme: group.tema,
      memberCount: group.miembros.length,
      memberNames: group.miembros.slice(0, 5).map((m) => m.usuario.nombre.split(" ")[0]),
    },
    alreadyMember: group.miembros.some((m) => m.usuarioId === me.id),
  });
});

/** POST /invites/:code/join — une al usuario al grupo como MIEMBRO (idempotente). */
invitesRouter.post("/:code/join", async (req, res) => {
  const me = currentUser(req);
  const group = await findGroupByCode(req.params.code);
  const alreadyMember = group.miembros.some((m) => m.usuarioId === me.id);
  if (!alreadyMember) {
    await prisma.miembroGrupo.create({ data: { grupoId: group.id, usuarioId: me.id } });
  }
  res.status(alreadyMember ? 200 : 201).json({ groupId: group.id, alreadyMember });
});
