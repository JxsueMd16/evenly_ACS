import { useMemo, useState, type FormEvent, type ReactNode } from "react"
import { Check, Loader2, Minus, Plus, Trash2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { UserAvatar } from "@/components/UserAvatar"
import { CategoryPicker } from "@/components/CategoryPicker"
import {
  assignedUnits,
  lineSubtotalCents,
  previewBill,
  sanitizeAmount,
  toCents,
  type DraftLine,
} from "@/lib/bill"
import type { BillInput } from "@/lib/api"
import type { CategoryId } from "@/lib/categories"
import type { User } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useFormatCurrency, useSettingsStore } from "@/store/settingsStore"

let lineCounter = 0
const newLine = (): DraftLine => ({
  key: `line-${++lineCounter}`,
  description: "",
  quantity: 1,
  unitPrice: "",
  shared: false,
  assignments: {},
})

const firstName = (user: User, currentUserId: string) => (user.id === currentUserId ? "Tú" : user.name.split(" ")[0])
const fullName = (user: User, currentUserId: string) => (user.id === currentUserId ? "Tú" : user.name)

/**
 * Formulario de una cuenta: tipo, nombre, participantes, quién pagó, ítems
 * (cantidad × precio) y cómo se cobra (partes iguales o por ítems). Lo usan
 * las cuentas de un grupo y las cuentas rápidas.
 */
export function BillForm({
  members,
  currentUserId,
  defaultCategory = "comida",
  submitLabel = "Guardar cuenta",
  onSubmit,
}: {
  members: User[]
  currentUserId: string
  defaultCategory?: CategoryId
  submitLabel?: string
  onSubmit: (bill: BillInput) => Promise<void>
}) {
  const formatCurrency = useFormatCurrency()
  const currency = useSettingsStore((s) => s.currency)
  const money = (cents: number) => formatCurrency(cents / 100)

  const [category, setCategory] = useState<CategoryId>(defaultCategory)
  const [name, setName] = useState("")
  const [participantIds, setParticipantIds] = useState<string[]>(() => members.map((m) => m.id))
  const [paidById, setPaidById] = useState(currentUserId)
  const [lines, setLines] = useState<DraftLine[]>(() => [newLine()])
  const [totalOnly, setTotalOnly] = useState(false)
  const [totalOnlyAmount, setTotalOnlyAmount] = useState("")
  const [splitType, setSplitType] = useState<"equal" | "items">("equal")
  const [showErrors, setShowErrors] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const participants = members.filter((m) => participantIds.includes(m.id))
  const allSelected = participantIds.length === members.length
  const effectiveSplit = totalOnly ? "equal" : splitType
  const activeLines = useMemo(() => (totalOnly ? [] : lines), [totalOnly, lines])

  const preview = useMemo(
    () =>
      previewBill({
        splitType: effectiveSplit,
        participantIds,
        lines: activeLines,
        totalOnlyCents: toCents(totalOnlyAmount),
      }),
    [effectiveSplit, participantIds, activeLines, totalOnlyAmount],
  )

  const problems = [...preview.problems]
  if (!name.trim()) problems.unshift("Ponle un nombre a la cuenta.")
  activeLines.forEach((line, i) => {
    if (!line.description.trim() || toCents(line.unitPrice) <= 0) {
      problems.push(`Completa la descripción y el precio del ítem ${i + 1}.`)
    }
  })
  if (preview.totalCents > 100_000_000) problems.push("El total no puede ser mayor a 1,000,000.")

  function toggleParticipant(id: string) {
    setParticipantIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))
  }

  function updateLine(key: string, patch: Partial<DraftLine>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  }

  function setAssignment(line: DraftLine, userId: string, quantity: number) {
    updateLine(line.key, { assignments: { ...line.assignments, [userId]: Math.max(0, quantity) } })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (problems.length > 0) {
      setShowErrors(true)
      return
    }
    const bill: BillInput = {
      description: name.trim(),
      category,
      paidById,
      splitType: effectiveSplit,
      ...(totalOnly && { amount: toCents(totalOnlyAmount) / 100 }),
      lines: activeLines.map((l) => ({
        description: l.description.trim(),
        quantity: l.quantity,
        unitPrice: toCents(l.unitPrice) / 100,
        shared: l.shared,
        assignments:
          effectiveSplit === "items"
            ? participantIds
                .filter((id) => (l.assignments[id] ?? 0) > 0)
                .map((userId) => ({ userId, quantity: l.shared ? 1 : l.assignments[userId]! }))
            : [],
      })),
      participants: participantIds.map((userId) => ({ userId })),
    }
    setIsSubmitting(true)
    try {
      await onSubmit(bill)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la cuenta.")
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 px-5">
      <Section title="Tipo de cuenta">
        <CategoryPicker value={category} onChange={setCategory} />
      </Section>

      <Section title="Nombre de la cuenta" htmlFor="bill-name">
        <Input
          id="bill-name"
          placeholder="Ej. Almuerzo del sábado"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
        />
      </Section>

      <Section
        title="Participantes"
        action={
          <button
            type="button"
            onClick={() => setParticipantIds(allSelected ? [currentUserId] : members.map((m) => m.id))}
            className="flex items-center gap-1 text-xs font-semibold text-primary"
          >
            <Users className="size-3.5" /> {allSelected ? "Solo yo" : "Todos"}
          </button>
        }
      >
        <div className="flex flex-wrap gap-2">
          {members.map((member) => {
            const selected = participantIds.includes(member.id)
            return (
              <button
                key={member.id}
                type="button"
                onClick={() => toggleParticipant(member.id)}
                aria-pressed={selected}
                aria-label={`Participante ${member.name}`}
                className={cn(
                  "flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm transition-colors",
                  selected ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground",
                )}
              >
                <UserAvatar user={member} className="size-7" />
                {firstName(member, currentUserId)}
                {selected && <Check className="size-3.5 text-primary" strokeWidth={3} />}
              </button>
            )
          })}
        </div>
      </Section>

      <Section title="¿Quién pagó?">
        <div className="flex gap-3 overflow-x-auto py-1">
          {members.map((member) => (
            <button
              type="button"
              key={member.id}
              onClick={() => setPaidById(member.id)}
              aria-pressed={paidById === member.id}
              aria-label={`Pagó ${member.name}`}
              className="flex flex-col items-center gap-1"
            >
              <UserAvatar
                user={member}
                className={cn("size-11 ring-2 ring-transparent", paidById === member.id && "ring-primary")}
              />
              <span className="text-[11px] text-muted-foreground">{firstName(member, currentUserId)}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section
        title={totalOnly ? "Monto total" : "Ítems"}
        action={
          <button
            type="button"
            onClick={() => setTotalOnly((v) => !v)}
            className="text-xs font-semibold text-primary"
          >
            {totalOnly ? "Detallar por ítems" : "Solo ingresar el total"}
          </button>
        }
      >
        {totalOnly ? (
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-muted-foreground">{currency}</span>
            <Input
              id="bill-total"
              inputMode="decimal"
              placeholder="0.00"
              value={totalOnlyAmount}
              onChange={(e) => setTotalOnlyAmount(sanitizeAmount(e.target.value))}
              className="text-lg font-semibold"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {lines.map((line, index) => (
              <div key={line.key} className="flex flex-col gap-2 rounded-2xl border border-border p-2.5">
                <div className="flex items-center gap-2">
                  <Input
                    aria-label={`Descripción ítem ${index + 1}`}
                    placeholder={index === 0 ? "Ej. Churrasco" : "Descripción del ítem"}
                    value={line.description}
                    onChange={(e) => updateLine(line.key, { description: e.target.value })}
                    maxLength={60}
                    className="h-10"
                  />
                  <button
                    type="button"
                    onClick={() => setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.key !== line.key) : [newLine()]))}
                    aria-label={`Quitar ítem ${index + 1}`}
                    className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-2">
                  <Stepper
                    value={line.quantity}
                    min={1}
                    max={999}
                    label={`Cantidad ítem ${index + 1}`}
                    onChange={(quantity) => updateLine(line.key, { quantity })}
                  />
                  <div className="relative">
                    <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {currency}
                    </span>
                    <Input
                      aria-label={`Precio ítem ${index + 1}`}
                      inputMode="decimal"
                      placeholder="c/u"
                      value={line.unitPrice}
                      onChange={(e) => updateLine(line.key, { unitPrice: sanitizeAmount(e.target.value) })}
                      className="h-9 pl-11 text-right text-sm"
                    />
                  </div>
                  <span className="min-w-16 text-right text-sm font-semibold text-foreground">
                    {money(lineSubtotalCents(line))}
                  </span>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setLines((prev) => [...prev, newLine()])}>
              <Plus /> Agregar ítem
            </Button>
          </div>
        )}
        <div className="mt-1 flex items-center justify-between rounded-2xl bg-muted/60 px-4 py-3">
          <span className="text-sm font-semibold text-foreground">Total</span>
          <span data-testid="bill-total" className="text-lg font-bold text-foreground">
            {money(preview.totalCents)}
          </span>
        </div>
      </Section>

      <Section title="¿Cómo se cobra?">
        <ToggleGroup
          type="single"
          value={effectiveSplit}
          onValueChange={(value) => value && setSplitType(value as "equal" | "items")}
        >
          <ToggleGroupItem value="equal">Partes iguales</ToggleGroupItem>
          <ToggleGroupItem value="items" disabled={totalOnly}>
            Por ítems
          </ToggleGroupItem>
        </ToggleGroup>

        {effectiveSplit === "items" && (
          <div className="mt-2 flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">
              Indica cuántas unidades consumió cada quien. Si algo se compartió (una pizza, una jarra), márcalo como
              compartido y elige quiénes lo consumieron.
            </p>
            {lines.map((line, index) => {
              const units = assignedUnits({
                ...line,
                assignments: Object.fromEntries(participantIds.map((id) => [id, line.assignments[id] ?? 0])),
              })
              const remaining = line.quantity - units
              const title = line.description.trim() || `Ítem ${index + 1}`
              return (
                <Card key={line.key} className="flex flex-col gap-2 p-3" data-testid={`assign-line-${index + 1}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {line.quantity} × {title}
                      </p>
                      <p className="text-xs text-muted-foreground">{money(lineSubtotalCents(line))}</p>
                    </div>
                    <label className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={line.shared}
                        onChange={(e) => updateLine(line.key, { shared: e.target.checked, assignments: {} })}
                        className="size-4 accent-[var(--color-primary)]"
                      />
                      Compartido
                    </label>
                  </div>

                  {line.shared ? (
                    <div className="flex flex-wrap gap-2">
                      {participants.map((p) => {
                        const on = (line.assignments[p.id] ?? 0) > 0
                        return (
                          <button
                            key={p.id}
                            type="button"
                            aria-pressed={on}
                            aria-label={`${title}: compartido con ${p.name}`}
                            onClick={() => setAssignment(line, p.id, on ? 0 : 1)}
                            className={cn(
                              "rounded-full border px-3 py-1 text-xs",
                              on ? "border-primary bg-primary/10 font-semibold text-primary" : "border-border text-muted-foreground",
                            )}
                          >
                            {firstName(p, currentUserId)}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col divide-y divide-border">
                      {participants.map((p) => {
                        const qty = line.assignments[p.id] ?? 0
                        return (
                          <div key={p.id} className="flex items-center gap-2 py-1.5">
                            <UserAvatar user={p} className="size-7" />
                            <span className="min-w-0 flex-1 truncate text-sm text-foreground">{fullName(p, currentUserId)}</span>
                            <Stepper
                              value={qty}
                              min={0}
                              max={qty + Math.max(0, remaining)}
                              label={`${title}: unidades de ${p.name}`}
                              onChange={(q) => setAssignment(line, p.id, q)}
                            />
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {!line.shared && (
                    <p
                      className={cn(
                        "text-right text-xs font-semibold",
                        remaining === 0 ? "text-success" : "text-destructive",
                      )}
                    >
                      {remaining === 0 ? "Todo asignado" : remaining > 0 ? `Faltan ${remaining}` : `Sobran ${-remaining}`}
                    </p>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </Section>

      <Section title="Resumen">
        <Card className="flex flex-col divide-y divide-border p-1" data-testid="bill-summary">
          {participants.map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-3">
              <UserAvatar user={p} className="size-8" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{fullName(p, currentUserId)}</span>
              <span className="text-sm font-bold text-foreground" data-testid={`share-${p.id}`}>
                {money(preview.shares.get(p.id) ?? 0)}
              </span>
            </div>
          ))}
          {participants.length === 0 && (
            <p className="p-3 text-sm text-muted-foreground">Selecciona quiénes participan en la cuenta.</p>
          )}
        </Card>
      </Section>

      {showErrors && problems.length > 0 && (
        <ul role="alert" className="flex flex-col gap-1 text-sm text-destructive">
          {problems.map((p) => (
            <li key={p}>• {p}</li>
          ))}
        </ul>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  )
}

function Section({
  title,
  htmlFor,
  action,
  children,
}: {
  title: string
  htmlFor?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={htmlFor} className="text-sm font-semibold text-foreground">
          {title}
        </Label>
        {action}
      </div>
      {children}
    </section>
  )
}

function Stepper({
  value,
  min,
  max,
  label,
  onChange,
}: {
  value: number
  min: number
  max: number
  label: string
  onChange: (value: number) => void
}) {
  return (
    <div className="flex h-9 items-center justify-between rounded-xl border border-input bg-card" aria-label={label} role="group">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={`${label}: menos`}
        className="flex size-8 items-center justify-center text-muted-foreground disabled:opacity-30"
      >
        <Minus className="size-3.5" />
      </button>
      <span className="min-w-5 text-center text-sm font-semibold text-foreground" data-testid="stepper-value">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={`${label}: más`}
        className="flex size-8 items-center justify-center text-muted-foreground disabled:opacity-30"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  )
}
