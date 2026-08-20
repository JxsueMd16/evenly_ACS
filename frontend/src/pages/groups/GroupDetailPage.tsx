import { useEffect, useState } from "react"
import { Link, Navigate, useParams } from "react-router-dom"
import { ArrowLeft, Loader2, Plus, Receipt } from "lucide-react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { UserAvatar } from "@/components/UserAvatar"
import { CategoryIcon } from "@/components/CategoryIcon"
import {
  computeGroupBalances,
  getExpensesForGroup,
  getGroup,
  getGroupMembers,
  getUserByIdSync,
} from "@/lib/mockApi"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/authStore"
import { useFormatCurrency } from "@/store/settingsStore"
import type { Expense, Group, MemberBalance } from "@/lib/types"

export function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const currentUser = useAuthStore((s) => s.user)!
  const formatCurrency = useFormatCurrency()
  const [group, setGroup] = useState<Group | null | undefined>(undefined)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [balances, setBalances] = useState<MemberBalance[]>([])

  useEffect(() => {
    if (!groupId) return
    getGroup(groupId)
      .then((g) => {
        setGroup(g ?? null)
        if (!g) return
        setBalances(computeGroupBalances(g.id))
        return getExpensesForGroup(g.id).then(setExpenses)
      })
      .catch(() => toast.error("No se pudo cargar el grupo."))
  }, [groupId])

  if (group === null) return <Navigate to="/groups" replace />

  if (group === undefined) {
    return (
      <div className="flex justify-center py-16 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    )
  }

  const members = getGroupMembers(group)

  return (
    <div className="relative flex flex-col gap-6 pb-6">
      <header className="flex items-center gap-3 bg-sky/50 px-5 pb-6 pt-6">
        <Link
          to="/groups"
          className="flex size-9 items-center justify-center rounded-2xl bg-card text-foreground shadow-sm"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <CategoryIcon category={group.category} className="size-11 bg-card shadow-sm" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold text-foreground">{group.name}</h1>
          <p className="text-xs text-muted-foreground">{members.length} integrantes</p>
        </div>
      </header>

      <section className="flex flex-col gap-3 px-5">
        <h2 className="text-base font-semibold text-foreground">Balance del grupo</h2>
        <Card className="flex flex-col divide-y divide-border p-2">
          {members.map((member) => {
            const net = balances.find((b) => b.userId === member.id)?.net ?? 0
            const isYou = member.id === currentUser.id
            return (
              <div key={member.id} className="flex items-center gap-3 p-3">
                <UserAvatar user={member} className="size-10" />
                <p className="flex-1 text-sm font-medium text-foreground">
                  {isYou ? "Tú" : member.name}
                </p>
                <p className={cn("text-sm font-bold", net >= 0 ? "text-success" : "text-destructive")}>
                  {net === 0 ? "Al día" : `${net > 0 ? "+" : "-"}${formatCurrency(Math.abs(net))}`}
                </p>
              </div>
            )
          })}
        </Card>
      </section>

      <section className="flex flex-col gap-3 px-5">
        <h2 className="text-base font-semibold text-foreground">Gastos</h2>

        {expenses.length === 0 && (
          <Card className="flex flex-col items-center gap-2 p-8 text-center text-muted-foreground">
            <Receipt className="size-8" />
            <p className="text-sm">Aún no hay gastos registrados en este grupo.</p>
          </Card>
        )}

        <div className="flex flex-col gap-2.5">
          {expenses.map((expense) => {
            const payer = getUserByIdSync(expense.paidById)
            const myShare = expense.participants.find((p) => p.userId === currentUser.id)?.amount
            return (
              <Card key={expense.id} className="flex items-center gap-3 p-3.5">
                <CategoryIcon category={expense.category} className="size-10" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{expense.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {payer?.id === currentUser.id ? "Tú pagaste" : `${payer?.name} pagó`} ·{" "}
                    {new Date(expense.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">{formatCurrency(expense.amount)}</p>
                  {myShare !== undefined && (
                    <p className="text-xs text-muted-foreground">tu parte {formatCurrency(myShare)}</p>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      </section>

      <div className="sticky bottom-4 z-30 flex justify-end px-5">
        <Link
          to={`/groups/${group.id}/add-expense`}
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30"
        >
          <Plus className="size-4" /> Agregar gasto
        </Link>
      </div>
    </div>
  )
}
