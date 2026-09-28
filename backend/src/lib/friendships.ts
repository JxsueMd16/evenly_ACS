import { prisma } from "./prisma.js";

/**
 * Relación del usuario actual con otro usuario:
 * - none: sin relación
 * - friends: amistad aceptada
 * - outgoing: el usuario actual envió una solicitud pendiente
 * - incoming: el otro usuario le envió una solicitud pendiente
 */
export type FriendshipStatus = "none" | "friends" | "outgoing" | "incoming";

export interface FriendshipInfo {
  status: FriendshipStatus;
  /** Id de la fila Amistad (para aceptar, rechazar o cancelar). */
  requestId: string | null;
}

/** Estado de la relación del usuario `meId` con cada uno de `otherIds`. */
export async function friendshipsWith(meId: string, otherIds: string[]): Promise<Map<string, FriendshipInfo>> {
  const result = new Map<string, FriendshipInfo>(otherIds.map((id) => [id, { status: "none", requestId: null }]));
  if (otherIds.length === 0) return result;

  const rows = await prisma.amistad.findMany({
    where: {
      OR: [
        { solicitanteId: meId, destinatarioId: { in: otherIds } },
        { destinatarioId: meId, solicitanteId: { in: otherIds } },
      ],
    },
  });

  for (const row of rows) {
    const otherId = row.solicitanteId === meId ? row.destinatarioId : row.solicitanteId;
    const status: FriendshipStatus =
      row.estado === "ACEPTADA" ? "friends" : row.solicitanteId === meId ? "outgoing" : "incoming";
    result.set(otherId, { status, requestId: row.id });
  }
  return result;
}

/** Busca la fila de amistad entre dos usuarios, en cualquier dirección. */
export function findFriendship(a: string, b: string) {
  return prisma.amistad.findFirst({
    where: {
      OR: [
        { solicitanteId: a, destinatarioId: b },
        { solicitanteId: b, destinatarioId: a },
      ],
    },
  });
}
