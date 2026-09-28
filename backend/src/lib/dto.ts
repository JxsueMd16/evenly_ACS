/**
 * Convierte los modelos de Prisma (en español, montos en centavos) al formato
 * JSON que consume el frontend (src/lib/types.ts). Nunca incluye passwordHash.
 */
import type { Usuario } from "../generated/prisma/client.js";
import { fromCents } from "./money.js";

type PublicUsuario = Pick<Usuario, "id" | "nombre" | "email" | "avatarColor">;

/** Campos de Usuario que se pueden seleccionar sin exponer el hash. */
export const publicUserSelect = { id: true, nombre: true, email: true, avatarColor: true } as const;

export function toUserDto(u: PublicUsuario) {
  return { id: u.id, name: u.nombre, email: u.email, avatarColor: u.avatarColor };
}

export interface ExpenseRecord {
  id: string;
  grupoId: string;
  descripcion: string;
  montoCentavos: number;
  categoria: string;
  tipoDivision: string;
  pagadoPorId: string;
  creadoPorId: string;
  createdAt: Date;
  pagadoPor: PublicUsuario;
  items: { usuarioId: string; montoCentavos: number }[];
  lineas: {
    id: string;
    descripcion: string;
    cantidad: number;
    precioUnitarioCentavos: number;
    compartido: boolean;
    asignaciones: { usuarioId: string; cantidad: number }[];
  }[];
}

export const expenseInclude = {
  pagadoPor: { select: publicUserSelect },
  items: { select: { usuarioId: true, montoCentavos: true } },
  lineas: {
    orderBy: { orden: "asc" },
    select: {
      id: true,
      descripcion: true,
      cantidad: true,
      precioUnitarioCentavos: true,
      compartido: true,
      asignaciones: { select: { usuarioId: true, cantidad: true } },
    },
  },
} as const;

export function toExpenseDto(e: ExpenseRecord) {
  return {
    id: e.id,
    groupId: e.grupoId,
    description: e.descripcion,
    amount: fromCents(e.montoCentavos),
    paidById: e.pagadoPorId,
    paidBy: toUserDto(e.pagadoPor),
    splitType: e.tipoDivision,
    participants: e.items.map((i) => ({ userId: i.usuarioId, amount: fromCents(i.montoCentavos) })),
    lines: e.lineas.map((l) => ({
      id: l.id,
      description: l.descripcion,
      quantity: l.cantidad,
      unitPrice: fromCents(l.precioUnitarioCentavos),
      subtotal: fromCents(l.cantidad * l.precioUnitarioCentavos),
      shared: l.compartido,
      assignments: l.asignaciones.map((a) => ({ userId: a.usuarioId, quantity: a.cantidad })),
    })),
    category: e.categoria,
    createdById: e.creadoPorId,
    createdAt: e.createdAt.toISOString(),
  };
}
