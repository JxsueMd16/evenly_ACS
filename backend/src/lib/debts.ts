/**
 * "Lo que debes" y "lo que te deben" de un usuario en todos sus grupos (UX-06).
 * Usa los mismos pagos sugeridos que el detalle del grupo, así los montos de
 * Inicio y del grupo siempre coinciden. Función pura para probarla aparte.
 */
import { computeNetCents, suggestSettlements, type ExpenseForBalance, type PaymentForBalance } from "./balances.js";

/** Un recordatorio por deuda cada 24 horas (UX-08). */
export const REMINDER_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export interface GroupForDebts {
  id: string;
  memberIds: string[];
  expenses: ExpenseForBalance[];
  payments: PaymentForBalance[];
}

export interface Debt {
  groupId: string;
  /** La otra persona: a quien le debo, o quien me debe. */
  userId: string;
  cents: number;
}

export function debtsOf(userId: string, groups: GroupForDebts[]): { owe: Debt[]; owedToMe: Debt[] } {
  const owe: Debt[] = [];
  const owedToMe: Debt[] = [];
  for (const group of groups) {
    const settlements = suggestSettlements(computeNetCents(group.memberIds, group.expenses, group.payments));
    for (const s of settlements) {
      if (s.fromUserId === userId) owe.push({ groupId: group.id, userId: s.toUserId, cents: s.cents });
      if (s.toUserId === userId) owedToMe.push({ groupId: group.id, userId: s.fromUserId, cents: s.cents });
    }
  }
  const byAmount = (a: Debt, b: Debt) => b.cents - a.cents;
  return { owe: owe.sort(byAmount), owedToMe: owedToMe.sort(byAmount) };
}

/** Cuándo se puede volver a recordar, o null si ya se puede. */
export function nextReminderAt(lastReminder: Date | null | undefined, now = new Date()): Date | null {
  if (!lastReminder) return null;
  const next = new Date(lastReminder.getTime() + REMINDER_COOLDOWN_MS);
  return next > now ? next : null;
}
