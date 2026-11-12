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

export const MAX_TIP_PERCENT = 30

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

/**
 * Reparte `total` en proporción a `weights` con el método del mayor residuo
 * (igual que el backend): la suma de las partes siempre es exactamente `total`.
 */
export function splitProportionallyCents(total: number, weights: Map<string, number>) {
  const ids = [...weights.keys()]
  const weightSum = ids.reduce((s, id) => s + weights.get(id)!, 0)
  if (weightSum <= 0) return splitEquallyCents(total, ids)
  const exact = ids.map((id) => (total * weights.get(id)!) / weightSum)
  const parts = exact.map(Math.floor)
  let remainder = total - parts.reduce((a, b) => a + b, 0)
  const order = exact
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index)
  for (const { index } of order) {
    if (remainder === 0) break
    parts[index]! += 1
    remainder -= 1
  }
  return new Map(ids.map((id, i) => [id, parts[i]!]))
}

export function assignedUnits(line: DraftLine) {
  return Object.values(line.assignments).reduce((sum, q) => sum + q, 0)
}

export interface BillPreview {
  /** Subtotal + propina. */
  totalCents: number
  /** Ítems o monto ingresado, sin propina. */
  subtotalCents: number
  tipCents: number
  /** userId → centavos que le tocan (con su parte de la propina). */
  shares: Map<string, number>
  /** Problemas que impiden guardar (vacío si todo cuadra). */
  problems: string[]
}

export function previewBill({
  splitType,
  participantIds,
  lines,
  totalOnlyCents,
  manualCents = {},
  tipPercent = 0,
}: {
  splitType: SplitType
  participantIds: string[]
  lines: DraftLine[]
  /** Total cuando la cuenta no tiene ítems. */
  totalOnlyCents: number
  /** Montos exactos por persona, sin propina (solo en división "itemized"). */
  manualCents?: Record<string, number>
  /** Propina en porcentaje del subtotal. */
  tipPercent?: number
}): BillPreview {
  const base = previewSubtotal({ splitType, participantIds, lines, totalOnlyCents, manualCents })
  const tipCents = Math.round((base.totalCents * tipPercent) / 100)
  const tip = splitProportionallyCents(tipCents, base.shares)
  const shares = tipCents > 0 ? new Map([...base.shares].map(([id, c]) => [id, c + (tip.get(id) ?? 0)])) : base.shares
  return {
    totalCents: base.totalCents + tipCents,
    subtotalCents: base.totalCents,
    tipCents,
    shares,
    problems: base.problems,
  }
}

function previewSubtotal({
  splitType,
  participantIds,
  lines,
  totalOnlyCents,
  manualCents,
}: {
  splitType: SplitType
  participantIds: string[]
  lines: DraftLine[]
  totalOnlyCents: number
  manualCents: Record<string, number>
}): Pick<BillPreview, "totalCents" | "shares" | "problems"> {
  const problems: string[] = []
  const totalCents = lines.length > 0 ? lines.reduce((s, l) => s + lineSubtotalCents(l), 0) : totalOnlyCents

  if (participantIds.length === 0) problems.push("Selecciona al menos un participante.")
  if (totalCents <= 0) problems.push(lines.length > 0 ? "Los ítems necesitan un precio." : "Ingresa el monto total.")

  if (splitType === "itemized") {
    const shares = new Map(participantIds.map((id) => [id, manualCents[id] ?? 0]))
    const assigned = [...shares.values()].reduce((s, c) => s + c, 0)
    if (totalCents > 0 && assigned !== totalCents) {
      const diff = (Math.abs(totalCents - assigned) / 100).toFixed(2)
      problems.push(
        assigned < totalCents ? `Faltan ${diff} por repartir entre los montos.` : `Los montos se pasan por ${diff}.`,
      )
    }
    return { totalCents, shares, problems }
  }

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
