import { useCallback, useEffect, useState } from "react"
import { Link, Navigate, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, ArrowRight, ChevronRight, Loader2, Plus, Receipt, Settings, UserPlus, Zap } from "lucide-react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { UserAvatar } from "@/components/UserAvatar"
import { CategoryIcon } from "@/components/CategoryIcon"
import { BillDetailDialog } from "@/components/bill/BillDetailDialog"
import { PayDialog } from "@/components/payments/PayDialog"
import { GroupPayments } from "@/components/payments/GroupPayments"
import { deleteExpense, getExpensesForGroup, getGroup, getPayments } from "@/lib/api"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/authStore"
import { useFormatCurrency } from "@/store/settingsStore"
import { useNotificationsStore } from "@/store/notificationsStore"
import type { Expense, GroupDetail, Payment, Settlement } from "@/lib/types"
import { GroupSettingsDialog } from "./GroupSettingsDialog"
import { InviteDialog } from "./InviteDialog"

export function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const currentUser = useAuthStore((s) => s.user)!
  const formatCurrency = useFormatCurrency()
  const [group, setGroup] = useState<GroupDetail | null | undefined>(undefined)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [error, setError] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [openBill, setOpenBill] = useState<Expense | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [payTo, setPayTo] = useState<Settlement | null>(null)
  const navigate = useNavigate()

  const load = useCallback(
    () =>
      groupId
        ? Promise.all([
            getGroup(groupId),
            getExpensesForGroup(groupId).catch(() => []),
            getPayments(groupId).catch(() => []),
          ]).then(([g, list, pays]) => {
            if (!g) toast.error("Ese grupo no existe o no perteneces a él.")
            setGroup(g)
            setExpenses(list)
            setPayments(pays)
          })
        : Promise.resolve(),
    [groupId],
  )

  // Si llega en tiempo real un aviso sobre este grupo (gasto nuevo), se recarga.
  const groupNoticeAt = useNotificationsStore((s) =>
    s.lastNotice?.link === `/groups/${groupId}` ? s.lastNotice.at : undefined,
  )
  useEffect(() => {
    load().catch((err: Error) => {
      setError(err.message)
      toast.error(err.message)
    })
  }, [load, groupNoticeAt])

  async function deleteBill(expense: Expense) {
    if (!group) return
    await deleteExpense(group.id, expense.id)
    toast.success("Cuenta eliminada")
    // Los balances cambian: se recarga el grupo completo.
    await load()
  }

  if (group === null) return <Navigate to="/groups" replace />

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 px-5 py-16 text-center text-sm text-destructive">
        {error}
        <Link to="/groups" className="font-semibold text-primary">
          Volver a tus grupos
        </Link>
      </div>
    )
  }

  if (group === undefined) {
    return (
      <div className="flex justify-center py-16 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    )
  }

  const members = group.members
  const isAdmin = members.some((m) => m.id === currentUser.id && m.role === "ADMIN")
  const canDelete = (expense: Expense) =>
    isAdmin || expense.createdById === currentUser.id || expense.paidById === currentUser.id
  const nameOf = (userId: string) =>
    userId === currentUser.id ? "Tú" : (members.find((m) => m.id === userId)?.name.split(" ")[0] ?? "Alguien")

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
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            {group.isQuick && (
              <>
                <Zap className="size-3 text-primary" /> Cuenta rápida ·{" "}
              </>
            )}
            {members.length} integrantes
          </p>
        </div>
        <button
          type="button"
          onClick={() => setInviteOpen(true)}
          aria-label="Invitar al grupo"
          className="flex size-9 items-center justify-center rounded-2xl bg-card text-foreground shadow-sm"
        >
          <UserPlus className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          aria-label="Ajustes del grupo"
          className="flex size-9 items-center justify-center rounded-2xl bg-card text-foreground shadow-sm"
        >
          <Settings className="size-4" />
        </button>
      </header>

      <section className="flex flex-col gap-3 px-5">
        <h2 className="text-base font-semibold text-foreground">Balance del grupo</h2>
        <Card className="flex flex-col divide-y divide-border p-2">
          {members.map((member) => {
            const net = group.balances.find((b) => b.userId === member.id)?.net ?? 0
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

      {group.settlements.length > 0 && (
        <section className="flex flex-col gap-3 px-5">
          <h2 className="text-base font-semibold text-foreground">Para quedar a mano</h2>
          <Card className="flex flex-col divide-y divide-border p-2">
            {group.settlements.map((s) => (
              <div key={`${s.fromUserId}-${s.toUserId}`} className="flex items-center gap-2 p-3 text-sm">
                <span className="font-medium text-foreground">{nameOf(s.fromUserId)}</span>
                <ArrowRight className="size-4 text-muted-foreground" />
                <span className="flex-1 font-medium text-foreground">{nameOf(s.toUserId)}</span>
                <span className="font-bold text-foreground">{formatCurrency(s.amount)}</span>
                {s.fromUserId === currentUser.id &&
                  (payments.some(
                    (p) => p.status === "PENDIENTE" && p.fromUserId === currentUser.id && p.toUserId === s.toUserId,
                  ) ? (
                    <span className="rounded-full bg-amber-500/15 px-2 py-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                      Por confirmar
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPayTo(s)}
                      aria-label={`Pagar a ${nameOf(s.toUserId)}`}
                      className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                    >
                      Pagar
                    </button>
                  ))}
              </div>
            ))}
          </Card>
        </section>
      )}

      <GroupPayments
        groupId={group.id}
        payments={payments}
        members={members}
        currentUserId={currentUser.id}
        onChanged={() => void load()}
      />

      <section className="flex flex-col gap-3 px-5">
        <h2 className="text-base font-semibold text-foreground">Cuentas</h2>

        {expenses.length === 0 && (
          <Card className="flex flex-col items-center gap-2 p-8 text-center text-muted-foreground">
            <Receipt className="size-8" />
            <p className="text-sm">Aún no hay cuentas en este grupo.</p>
            <p className="text-xs">Toca "Nueva cuenta" para registrar un almuerzo, un taxi o lo que hayan compartido.</p>
          </Card>
        )}

        <div className="flex flex-col gap-2.5">
          {expenses.map((expense) => {
            const payer = expense.paidBy
            const myShare = expense.participants.find((p) => p.userId === currentUser.id)?.amount
            return (
              <button
                key={expense.id}
                type="button"
                onClick={() => setOpenBill(expense)}
                aria-label={`Ver cuenta ${expense.description}`}
                className="text-left"
              >
              <Card className="flex items-center gap-3 p-3.5">
                <CategoryIcon category={expense.category} className="size-10" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{expense.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {payer.id === currentUser.id ? "Tú pagaste" : `${payer.name.split(" ")[0]} pagó`}
                    {expense.lines.length > 0 && ` · ${expense.lines.length} ítems`} ·{" "}
                    {new Date(expense.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">{formatCurrency(expense.amount)}</p>
                  {myShare !== undefined && (
                    <p className="text-xs text-muted-foreground">tu parte {formatCurrency(myShare)}</p>
                  )}
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Card>
              </button>
            )
          })}
        </div>
      </section>

      <div className="sticky bottom-4 z-30 flex justify-end px-5">
        <Link
          to={`/groups/${group.id}/add-expense`}
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30"
        >
          <Plus className="size-4" /> Nueva cuenta
        </Link>
      </div>

      <GroupSettingsDialog
        group={group}
        currentUserId={currentUser.id}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onGroupChanged={setGroup}
        onGroupLeft={(message) => {
          toast.success(message)
          navigate("/groups", { replace: true })
        }}
      />

      <InviteDialog group={group} isAdmin={isAdmin} open={inviteOpen} onOpenChange={setInviteOpen} />

      {payTo && (
        <PayDialog
          groupId={group.id}
          receiver={members.find((m) => m.id === payTo.toUserId)!}
          suggestedAmount={payTo.amount}
          maxAmount={Math.abs(Math.min(0, group.myBalance))}
          onOpenChange={(open) => !open && setPayTo(null)}
          onPaid={() => void load()}
        />
      )}

      {openBill && (
        <BillDetailDialog
          expense={openBill}
          members={members}
          currentUserId={currentUser.id}
          canDelete={canDelete(openBill)}
          onOpenChange={(next) => !next && setOpenBill(null)}
          onDelete={() => deleteBill(openBill)}
        />
      )}
    </div>
  )
}
