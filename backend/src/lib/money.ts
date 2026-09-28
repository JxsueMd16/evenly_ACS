/**
 * Utilidades de dinero. Internamente todo se maneja en centavos enteros para
 * que 100 / 3 no termine en 99.99 ni en errores de punto flotante.
 */

export const MAX_AMOUNT = 1_000_000;

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

/** true si el número tiene como máximo 2 decimales (12.5, 12.50, 12 sí; 12.345 no). */
export function hasAtMostTwoDecimals(amount: number): boolean {
  return Math.abs(amount * 100 - Math.round(amount * 100)) < 1e-6;
}

/**
 * Reparte `totalCents` en partes iguales. Los centavos que sobran se asignan
 * uno a uno a los primeros participantes, así la suma siempre es exacta:
 * 10000 entre 3 => [3334, 3333, 3333].
 */
export function splitEqually(totalCents: number, userIds: string[]): { userId: string; cents: number }[] {
  if (userIds.length === 0) return [];
  const base = Math.floor(totalCents / userIds.length);
  const remainder = totalCents - base * userIds.length;
  return userIds.map((userId, index) => ({ userId, cents: base + (index < remainder ? 1 : 0) }));
}
