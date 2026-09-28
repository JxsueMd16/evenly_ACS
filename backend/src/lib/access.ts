/**
 * Control de acceso a grupos. Si el usuario no es integrante se responde 404
 * (y no 403) para no revelar que el grupo existe.
 */
import { prisma } from "./prisma.js";
import { forbidden, notFound } from "./errors.js";
import { idSchema } from "./schemas.js";

const GROUP_NOT_FOUND = "Grupo no encontrado.";

export async function requireMembership(groupId: string | undefined, userId: string) {
  if (!idSchema.safeParse(groupId).success) throw notFound(GROUP_NOT_FOUND);
  const membership = await prisma.miembroGrupo.findUnique({
    where: { grupoId_usuarioId: { grupoId: groupId!, usuarioId: userId } },
  });
  if (!membership) throw notFound(GROUP_NOT_FOUND);
  return membership;
}

export async function requireAdmin(groupId: string | undefined, userId: string) {
  const membership = await requireMembership(groupId, userId);
  if (membership.rol !== "ADMIN") {
    throw forbidden("Solo el administrador del grupo puede realizar esta acción.");
  }
  return membership;
}
