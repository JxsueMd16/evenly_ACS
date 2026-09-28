/**
 * Cálculo de una cuenta: total y cuánto le toca a cada participante.
 * Todo en centavos enteros. Función pura (sin base de datos) para poder
 * probarla con pruebas unitarias.
 *
 * Modos de división:
 * - equal:    el total se reparte en partes iguales entre los participantes.
 * - items:    cada quien paga lo que consumió. Por cada línea:
 *               · normal: se asignan unidades a cada persona (deben asignarse todas).
 *               · compartida: el subtotal se reparte en partes iguales entre quienes la consumieron.
 * - itemized: montos manuales por persona (deben sumar el total).
 */
import { MAX_AMOUNT, splitEqually } from "./money.js";

export type SplitType = "equal" | "items" | "itemized";

export interface BillLine {
  description: string;
  quantity: number;
  unitPriceCents: number;
  shared: boolean;
  assignments: { userId: string; quantity: number }[];
}

export interface BillInput {
  splitType: SplitType;
  participantIds: string[];
  /** Total cuando la cuenta no tiene líneas (por ejemplo, un taxi). */
  amountCents?: number | undefined;
  lines: BillLine[];
  /** Montos por persona, solo en modo itemized. */
  manualShares?: { userId: string; cents: number | undefined }[];
}

export interface BillResult {
  totalCents: number;
  shares: { userId: string; cents: number }[];
}

export class BillError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "BillError";
  }
}

const money = (cents: number) => (cents / 100).toFixed(2);

export function lineSubtotal(line: Pick<BillLine, "quantity" | "unitPriceCents">) {
  return line.quantity * line.unitPriceCents;
}

export function computeBill(input: BillInput): BillResult {
  const { splitType, participantIds, lines } = input;
  if (participantIds.length === 0) throw new BillError("NO_PARTICIPANTS", "Selecciona al menos un participante.");
  if (new Set(participantIds).size !== participantIds.length) {
    throw new BillError("DUPLICATE_PARTICIPANT", "Un participante aparece más de una vez.");
  }

  const linesTotal = lines.reduce((sum, l) => sum + lineSubtotal(l), 0);
  let totalCents: number;
  if (lines.length > 0) {
    if (input.amountCents !== undefined && input.amountCents !== linesTotal) {
      throw new BillError(
        "TOTAL_MISMATCH",
        `El total (${money(input.amountCents)}) no coincide con la suma de los ítems (${money(linesTotal)}).`,
      );
    }
    totalCents = linesTotal;
  } else {
    if (input.amountCents === undefined) {
      throw new BillError("MISSING_TOTAL", "Agrega al menos un ítem o ingresa el monto total.");
    }
    totalCents = input.amountCents;
  }
  if (totalCents <= 0) throw new BillError("MISSING_TOTAL", "El total de la cuenta debe ser mayor a 0.");
  if (totalCents > MAX_AMOUNT * 100) {
    throw new BillError("TOTAL_TOO_LARGE", `El total no puede ser mayor a ${MAX_AMOUNT.toLocaleString("en-US")}.`);
  }

  if (splitType === "equal") {
    return { totalCents, shares: splitEqually(totalCents, participantIds) };
  }

  if (splitType === "itemized") {
    const manual = input.manualShares ?? [];
    if (manual.length === 0 || manual.some((s) => s.cents === undefined)) {
      throw new BillError("SPLIT_MISMATCH", "En la división con montos cada participante necesita un monto.");
    }
    const shares = manual.map((s) => ({ userId: s.userId, cents: s.cents! }));
    const assigned = shares.reduce((sum, s) => sum + s.cents, 0);
    if (assigned !== totalCents) {
      throw new BillError("SPLIT_MISMATCH", `La división no cuadra: se asignaron ${money(assigned)} de ${money(totalCents)}.`);
    }
    return { totalCents, shares };
  }

  // splitType === "items"
  if (lines.length === 0) {
    throw new BillError("MISSING_ITEMS", "Para dividir por ítems agrega los ítems de la cuenta.");
  }
  const participants = new Set(participantIds);
  const byUser = new Map<string, number>();
  const add = (userId: string, cents: number) => byUser.set(userId, (byUser.get(userId) ?? 0) + cents);

  lines.forEach((line, index) => {
    const label = `"${line.description}"`;
    if (line.assignments.length === 0) {
      throw new BillError("ITEMS_UNASSIGNED", `Asigna ${label} a quien lo consumió.`);
    }
    const ids = line.assignments.map((a) => a.userId);
    if (new Set(ids).size !== ids.length) {
      throw new BillError("DUPLICATE_PARTICIPANT", `Una persona aparece dos veces en ${label}.`);
    }
    if (ids.some((id) => !participants.has(id))) {
      throw new BillError("NOT_A_PARTICIPANT", `${label} está asignado a alguien que no participa en la cuenta.`);
    }

    if (line.shared) {
      for (const share of splitEqually(lineSubtotal(line), ids)) add(share.userId, share.cents);
      return;
    }
    const assignedUnits = line.assignments.reduce((sum, a) => sum + a.quantity, 0);
    if (assignedUnits !== line.quantity) {
      const missing = line.quantity - assignedUnits;
      throw new BillError(
        "ITEMS_UNASSIGNED",
        missing > 0
          ? `Faltan ${missing} de ${line.quantity} unidades de ${label} por asignar (línea ${index + 1}).`
          : `Se asignaron ${assignedUnits} unidades de ${label}, pero solo hay ${line.quantity}.`,
      );
    }
    for (const a of line.assignments) add(a.userId, a.quantity * line.unitPriceCents);
  });

  // Se conserva el orden de los participantes; quien no consumió nada no paga.
  const shares = participantIds
    .filter((id) => (byUser.get(id) ?? 0) > 0)
    .map((userId) => ({ userId, cents: byUser.get(userId)! }));
  return { totalCents, shares };
}
