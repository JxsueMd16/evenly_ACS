import type { CuentaBancaria } from "../generated/prisma/client.js";
import { prisma } from "./prisma.js";

export function toBankAccountDto(a: CuentaBancaria) {
  return { id: a.id, bank: a.banco, type: a.tipo, number: a.numero, holder: a.titular, visible: a.visible };
}

/**
 * Los datos de pago (cuentas bancarias visibles y preferencia) de otro usuario
 * solo los ve quien comparte un grupo o una amistad con él.
 */
export async function canSeePaymentInfo(viewerId: string, ownerId: string): Promise<boolean> {
  if (viewerId === ownerId) return true;
  const [friendship, sharedGroup] = await Promise.all([
    prisma.amistad.findFirst({
      where: {
        estado: "ACEPTADA",
        OR: [
          { solicitanteId: viewerId, destinatarioId: ownerId },
          { solicitanteId: ownerId, destinatarioId: viewerId },
        ],
      },
      select: { id: true },
    }),
    prisma.miembroGrupo.findFirst({
      where: { usuarioId: viewerId, grupo: { miembros: { some: { usuarioId: ownerId } } } },
      select: { id: true },
    }),
  ]);
  return Boolean(friendship || sharedGroup);
}
