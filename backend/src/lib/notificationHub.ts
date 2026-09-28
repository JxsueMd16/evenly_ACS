/**
 * Notificaciones en tiempo real con Server-Sent Events.
 *
 * Cada pestaña abierta mantiene una conexión (GET /notifications/stream).
 * Cuando algo cambia los avisos de un usuario (le llega una solicitud de
 * amistad, se registra un gasto en su grupo…), las rutas llaman a
 * notifyUsers() y el servidor le envía al instante los contadores nuevos y,
 * si corresponde, un aviso para mostrar.
 *
 * Las conexiones viven en memoria: funciona con una sola instancia del
 * backend (el plan de Render usado). Con varias instancias habría que
 * repartir los eventos con Redis pub/sub o similar.
 */
import type { Response } from "express";
import { prisma } from "./prisma.js";
import { computeNetCents } from "./balances.js";
import { fromCents } from "./money.js";

export interface NotificationCounts {
  friendRequests: number;
  groupsWithDebt: number;
  totalDebt: number;
  /** Pagos que otros registraron a favor del usuario y esperan su confirmación. */
  paymentsToConfirm: number;
}

export interface Notice {
  kind:
    | "friend-request"
    | "friend-accepted"
    | "group-added"
    | "expense-added"
    | "payment-reported"
    | "payment-confirmed"
    | "payment-rejected";
  message: string;
  /** Ruta del frontend a la que lleva el aviso. */
  link?: string;
}

const clients = new Map<string, Set<Response>>();

export function addClient(userId: string, res: Response) {
  const set = clients.get(userId) ?? new Set<Response>();
  set.add(res);
  clients.set(userId, set);
}

export function removeClient(userId: string, res: Response) {
  const set = clients.get(userId);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) clients.delete(userId);
}

export function send(res: Response, event: string, data: unknown) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

/** Contadores de avisos de un usuario: solicitudes pendientes y grupos donde debe dinero. */
export async function computeCounts(userId: string): Promise<NotificationCounts> {
  const [friendRequests, paymentsToConfirm, groups] = await Promise.all([
    prisma.amistad.count({ where: { destinatarioId: userId, estado: "PENDIENTE" } }),
    prisma.pago.count({ where: { acreedorId: userId, estado: "PENDIENTE" } }),
    prisma.grupo.findMany({
      where: { miembros: { some: { usuarioId: userId } } },
      select: {
        miembros: { select: { usuarioId: true } },
        gastos: {
          select: {
            pagadoPorId: true,
            montoCentavos: true,
            items: { select: { usuarioId: true, montoCentavos: true } },
          },
        },
        pagos: {
          where: { estado: "CONFIRMADO" },
          select: { deudorId: true, acreedorId: true, montoCentavos: true },
        },
      },
    }),
  ]);

  let groupsWithDebt = 0;
  let debtCents = 0;
  for (const group of groups) {
    const net =
      computeNetCents(
        group.miembros.map((m) => m.usuarioId),
        group.gastos,
        group.pagos,
      ).get(userId) ?? 0;
    if (net < 0) {
      groupsWithDebt++;
      debtCents += -net;
    }
  }
  return { friendRequests, groupsWithDebt, totalDebt: fromCents(debtCents), paymentsToConfirm };
}

/**
 * Envía contadores actualizados (y opcionalmente un aviso) a los usuarios
 * indicados que tengan la app abierta. No lanza errores: una falla al
 * notificar no debe romper la acción que la originó.
 */
export function notifyUsers(userIds: Iterable<string>, notices: Map<string, Notice> = new Map()) {
  for (const userId of new Set(userIds)) {
    const connections = clients.get(userId);
    if (!connections?.size) continue;
    computeCounts(userId)
      .then((counts) => {
        for (const res of connections) {
          send(res, "counts", counts);
          const notice = notices.get(userId);
          if (notice) send(res, "notice", notice);
        }
      })
      .catch((err: unknown) => {
        console.error(`[notificaciones] ${(err as Error)?.name ?? "Error"} al notificar`);
      });
  }
}

/** Ids de los integrantes de un grupo (para notificarlos a todos). */
export async function groupMemberIds(groupId: string): Promise<string[]> {
  const members = await prisma.miembroGrupo.findMany({ where: { grupoId: groupId }, select: { usuarioId: true } });
  return members.map((m) => m.usuarioId);
}
