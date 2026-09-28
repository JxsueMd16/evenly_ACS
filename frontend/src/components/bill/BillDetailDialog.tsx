import { useState } from "react"
import { Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CategoryIcon } from "@/components/CategoryIcon"
import { UserAvatar } from "@/components/UserAvatar"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { getCategory } from "@/lib/categories"
import type { Expense, User } from "@/lib/types"
import { useFormatCurrency } from "@/store/settingsStore"

const SPLIT_LABEL: Record<Expense["splitType"], string> = {
  equal: "Partes iguales",
  items: "Por ítems (cada quien paga lo que consumió)",
  itemized: "Montos personalizados",
}

/** Detalle de una cuenta: ítems, cómo se cobró y qué le toca a cada quien. */
export function BillDetailDialog({
  expense,
  members,
  currentUserId,
  canDelete,
  onOpenChange,
  onDelete,
}: {
  expense: Expense
  members: User[]
  currentUserId: string
  canDelete: boolean
  onOpenChange: (open: boolean) => void
  onDelete: () => Promise<void>
}) {
  const formatCurrency = useFormatCurrency()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const nameOf = (id: string) =>
    id === currentUserId ? "Tú" : (members.find((m) => m.id === id)?.name ?? "Ex integrante")
  const userOf = (id: string) => members.find((m) => m.id === id)

  /** Qué consumió cada persona (solo en división por ítems). */
  function consumedBy(userId: string) {
    return expense.lines
      .map((line) => {
        const a = line.assignments.find((x) => x.userId === userId)
        if (!a) return null
        return line.shared ? `${line.description} (compartido)` : `${a.quantity} × ${line.description}`
      })
      .filter(Boolean)
      .join(", ")
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <CategoryIcon category={expense.category} className="size-11" />
            <div className="min-w-0">
              <DialogTitle className="truncate">{expense.description}</DialogTitle>
              <DialogDescription>
                {getCategory(expense.category).label} ·{" "}
                {new Date(expense.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "long" })}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 flex flex-col gap-5">
          <div className="flex items-end justify-between rounded-2xl bg-muted/60 px-4 py-3">
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(expense.amount)}</p>
            </div>
            <p className="text-right text-xs text-muted-foreground">
              Pagó
              <br />
              <span className="text-sm font-semibold text-foreground">{nameOf(expense.paidById)}</span>
            </p>
          </div>

          {expense.lines.length > 0 && (
            <section className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-foreground">Ítems</h3>
              <div className="flex flex-col divide-y divide-border rounded-2xl border border-border">
                {expense.lines.map((line) => (
                  <div key={line.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                    <span className="w-8 font-semibold text-muted-foreground">{line.quantity}×</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-foreground">{line.description}</span>
                      <span className="block text-xs text-muted-foreground">
                        {formatCurrency(line.unitPrice)} c/u{line.shared && " · compartido"}
                      </span>
                    </span>
                    <span className="font-semibold text-foreground">{formatCurrency(line.subtotal)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-foreground">Cuánto le toca a cada quien</h3>
            <p className="text-xs text-muted-foreground">{SPLIT_LABEL[expense.splitType]}</p>
            <div className="flex flex-col divide-y divide-border rounded-2xl border border-border">
              {expense.participants.map((p) => {
                const user = userOf(p.userId)
                const detail = expense.splitType === "items" ? consumedBy(p.userId) : ""
                return (
                  <div key={p.userId} className="flex items-center gap-3 px-3 py-2.5" data-testid={`detail-share-${p.userId}`}>
                    {user && <UserAvatar user={user} className="size-8" />}
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-foreground">{nameOf(p.userId)}</span>
                      {detail && <span className="block text-xs text-muted-foreground">{detail}</span>}
                    </span>
                    <span className="text-sm font-bold text-foreground">{formatCurrency(p.amount)}</span>
                  </div>
                )
              })}
            </div>
          </section>

          {canDelete && (
            <Button variant="outline" className="text-destructive" onClick={() => setConfirmDelete(true)}>
              <Trash2 /> Eliminar cuenta
            </Button>
          )}
        </div>

        {confirmDelete && (
          <ConfirmDialog
            open
            onOpenChange={(next) => !next && setConfirmDelete(false)}
            title="Eliminar cuenta"
            description={`¿Eliminar "${expense.description}" por ${formatCurrency(expense.amount)}? Los balances del grupo se recalcularán.`}
            confirmLabel="Eliminar"
            onConfirm={async () => {
              await onDelete()
              onOpenChange(false)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
