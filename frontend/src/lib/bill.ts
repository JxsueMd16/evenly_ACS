/**
 * Vista previa del reparto de una cuenta mientras se llena el formulario.
 * Replica backend/src/lib/bill.ts (que es quien valida y calcula lo que se
 * guarda); aquí solo se usa para mostrar totales y avisos en vivo.
 */
import type { SplitType } from "./types"

export interface DraftLine {
  key: string
  description: string
  quantity: number
  /** Texto tal como lo escribió el usuario (ej. "25.50"). */
  unitPrice: string
  shared: boolean
  /** userId → unidades asignadas (en compartidas, 1 = lo consumió). */
  assignments: Record<string, number>
}

export const toCents = (value: string | number) => Math.round((Number(value) || 0) * 100)

export const lineSubtotalCents = (line: Pick<DraftLine, "quantity" | "unitPrice">) =>
  line.quantity * toCents(line.unitPrice)

/** Reparte en partes iguales; los centavos sobrantes van a los primeros. */
export function splitEquallyCents(total: number, ids: string[]) {
  if (ids.length === 0) return new Map<string, number>()
  const base = Math.floor(total / ids.length)
  const rest = total - base * ids.length
  return new Map(ids.map((id, i) => [id, base + (i < rest ? 1 : 0)]))
}

export function assignedUnits(line: DraftLine) {
  return Object.values(line.assignments).reduce((sum, q) => sum + q, 0)
}

export interface BillPreview {
  totalCents: number
  /** userId → centavos que le tocan. */
  shares: Map<string, number>
  /** Problemas que impiden guardar (vacío si todo cuadra). */
  problems: string[]
}

export function previewBill({
  splitType,
  participantIds,
  lines,
  totalOnlyCents,
}: {
  splitType: SplitType
  participantIds: string[]
  lines: DraftLine[]
  /** Total cuando la cuenta no tiene ítems. */
  totalOnlyCents: number
}): BillPreview {
  const problems: string[] = []
  const totalCents = lines.length > 0 ? lines.reduce((s, l) => s + lineSubtotalCents(l), 0) : totalOnlyCents

  if (participantIds.length === 0) problems.push("Selecciona al menos un participante.")
  if (totalCents <= 0) problems.push(lines.length > 0 ? "Los ítems necesitan un precio." : "Ingresa el monto total.")

  if (splitType === "equal" || lines.length === 0) {
    return { totalCents, shares: splitEquallyCents(totalCents, participantIds), problems }
  }

  const shares = new Map<string, number>()
  const add = (id: string, cents: number) => shares.set(id, (shares.get(id) ?? 0) + cents)
  for (const line of lines) {
    const name = line.description.trim() || "un ítem"
    const who = participantIds.filter((id) => (line.assignments[id] ?? 0) > 0)
    if (line.shared) {
      if (who.length === 0) problems.push(`Marca quién consumió "${name}".`)
      for (const [id, cents] of splitEquallyCents(lineSubtotalCents(line), who)) add(id, cents)
      continue
    }
    const units = who.reduce((s, id) => s + line.assignments[id]!, 0)
    if (units < line.quantity) problems.push(`Faltan ${line.quantity - units} de ${line.quantity} de "${name}" por asignar.`)
    if (units > line.quantity) problems.push(`Asignaste ${units} de "${name}" pero solo hay ${line.quantity}.`)
    for (const id of who) add(id, line.assignments[id]! * toCents(line.unitPrice))
  }
  return { totalCents, shares, problems }
}

/** Deja solo dígitos y un punto decimal con máximo 2 decimales (para inputs de dinero). */
export function sanitizeAmount(value: string) {
  const [whole = "", ...rest] = value.replace(/[^0-9.]/g, "").split(".")
  return rest.length ? `${whole}.${rest.join("").slice(0, 2)}` : whole
}
