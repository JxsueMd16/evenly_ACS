import { useEffect, useMemo, useState, type FormEvent } from "react"
import { Link, Navigate, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Check, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { UserAvatar } from "@/components/UserAvatar"
import { CategoryIcon } from "@/components/CategoryIcon"
import { addExpense, getGroup, getGroupMembers } from "@/lib/mockApi"
import { CATEGORIES, type CategoryId } from "@/lib/categories"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/authStore"
import { useFormatCurrency, useSettingsStore } from "@/store/settingsStore"
import type { Group, SplitType } from "@/lib/types"

export function AddExpensePage() {
  const { groupId } = useParams<{ groupId: string }>()
  const currentUser = useAuthStore((s) => s.user)!
  const formatCurrency = useFormatCurrency()
  const currency = useSettingsStore((s) => s.currency)
  const navigate = useNavigate()

  const [group, setGroup] = useState<Group | null | undefined>(undefined)
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [paidById, setPaidById] = useState(currentUser.id)
  const [category, setCategory] = useState<CategoryId>(CATEGORIES[0].id)
  const [splitType, setSplitType] = useState<SplitType>("equal")
  const [includedIds, setIncludedIds] = useState<string[]>([])
  const [itemAmounts, setItemAmounts] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!groupId) return
    getGroup(groupId).then((g) => {
      setGroup(g ?? null)
      if (g) {
        setIncludedIds(g.memberIds)
        setCategory(g.category)
      }
    })
  }, [groupId])

  const members = useMemo(() => (group ? getGroupMembers(group) : []), [group])
  const numericAmount = Number(amount) || 0

  const equalShare =
    splitType === "equal" && includedIds.length > 0 ? numericAmount / includedIds.length : 0

  const itemizedTotal = Object.values(itemAmounts).reduce((sum, v) => sum + (Number(v) || 0), 0)
  const remaining = Math.round((numericAmount - itemizedTotal) * 100) / 100

  if (group === null) return <Navigate to="/groups" replace />

  function toggleIncluded(id: string) {
    setIncludedIds((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!description.trim()) return setError("Agrega una descripción.")
    if (numericAmount <= 0) return setError("El monto debe ser mayor a 0.")

    const participants =
      splitType === "equal"
        ? includedIds.map((userId) => ({
            userId,
            amount: Math.round((numericAmount / includedIds.length) * 100) / 100,
          }))
        : members
            .map((m) => ({ userId: m.id, amount: Number(itemAmounts[m.id]) || 0 }))
            .filter((p) => p.amount > 0)

    if (participants.length === 0) return setError("Selecciona al menos un integrante.")

    if (splitType === "itemized" && Math.abs(remaining) > 0.05) {
      return setError(`La división no cuadra. Faltan ${formatCurrency(remaining)} por asignar.`)
    }

    setIsSubmitting(true)
    try {
      await addExpense({
        groupId: group!.id,
        description,
        amount: numericAmount,
        paidById,
        splitType,
        participants,
        category,
      })
      toast.success("Gasto agregado")
      navigate(`/groups/${group!.id}`, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo agregar el gasto.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-6">
      <header className="flex items-center gap-3 bg-pink/40 px-5 pb-6 pt-6">
        <Link
          to={groupId ? `/groups/${groupId}` : "/groups"}
          className="flex size-9 items-center justify-center rounded-2xl bg-card text-foreground shadow-sm"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-foreground">Agregar gasto</h1>
          {group && <p className="text-xs text-muted-foreground">{group.name}</p>}
        </div>
      </header>

      {group === undefined ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 px-5">
          <div className="flex flex-col items-center gap-1 py-2">
            <Label htmlFor="amount" className="text-xs">
              Monto
            </Label>
            <div className="flex items-center gap-1">
              <span className="text-xl font-bold text-muted-foreground">{currency}</span>
              <input
                id="amount"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                className="w-40 bg-transparent text-center text-4xl font-bold text-foreground outline-none placeholder:text-muted-foreground/40"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Descripción</Label>
            <Input
              id="description"
              placeholder="Ej. Cena, gasolina, hospedaje..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Categoría</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((option) => (
                <button
                  type="button"
                  key={option.id}
                  onClick={() => setCategory(option.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-2xl p-1.5 transition-colors",
                    category === option.id && "ring-2 ring-primary",
                  )}
                >
                  <CategoryIcon category={option.id} className="size-10" />
                  <span className="text-[10px] text-muted-foreground">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>¿Quién pagó?</Label>
            <div className="flex gap-3 overflow-x-auto py-1">
              {members.map((member) => (
                <button
                  type="button"
                  key={member.id}
                  onClick={() => setPaidById(member.id)}
                  className="flex flex-col items-center gap-1"
                >
                  <UserAvatar
                    user={member}
                    className={cn(
                      "size-12 ring-2 ring-transparent",
                      paidById === member.id && "ring-primary",
                    )}
                  />
                  <span className="text-[11px] text-muted-foreground">
                    {member.id === currentUser.id ? "Tú" : member.name.split(" ")[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>¿Cómo se divide?</Label>
            <ToggleGroup
              type="single"
              value={splitType}
              onValueChange={(value) => value && setSplitType(value as SplitType)}
            >
              <ToggleGroupItem value="equal">Equitativo</ToggleGroupItem>
              <ToggleGroupItem value="itemized">Por ítem</ToggleGroupItem>
            </ToggleGroup>
          </div>

          {splitType === "equal" ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">Selecciona quiénes participan en este gasto</p>
              <div className="flex flex-col divide-y divide-border rounded-3xl border border-border">
                {members.map((member) => {
                  const checked = includedIds.includes(member.id)
                  return (
                    <button
                      type="button"
                      key={member.id}
                      onClick={() => toggleIncluded(member.id)}
                      className="flex items-center gap-3 p-3"
                    >
                      <UserAvatar user={member} className="size-9" />
                      <span className="flex-1 text-left text-sm font-medium text-foreground">
                        {member.id === currentUser.id ? "Tú" : member.name}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {checked ? formatCurrency(equalShare) : "—"}
                      </span>
                      <span
                        className={cn(
                          "flex size-5 items-center justify-center rounded-full border-2 border-border text-primary-foreground",
                          checked && "border-primary bg-primary",
                        )}
                      >
                        {checked && <Check className="size-3" strokeWidth={3} />}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Asigna el monto exacto de cada integrante</p>
                <span className={cn("text-xs font-semibold", Math.abs(remaining) > 0.05 ? "text-destructive" : "text-success")}>
                  Restante {formatCurrency(remaining)}
                </span>
              </div>
              <div className="flex flex-col divide-y divide-border rounded-3xl border border-border">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 p-3">
                    <UserAvatar user={member} className="size-9" />
                    <span className="flex-1 text-sm font-medium text-foreground">
                      {member.id === currentUser.id ? "Tú" : member.name}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">{currency}</span>
                      <input
                        inputMode="decimal"
                        placeholder="0.00"
                        value={itemAmounts[member.id] ?? ""}
                        onChange={(e) =>
                          setItemAmounts((prev) => ({
                            ...prev,
                            [member.id]: e.target.value.replace(/[^0-9.]/g, ""),
                          }))
                        }
                        className="w-20 rounded-xl border border-input bg-card px-2 py-1.5 text-right text-sm outline-none focus-visible:border-primary"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            Agregar gasto
          </Button>
        </form>
      )}
    </div>
  )
}
