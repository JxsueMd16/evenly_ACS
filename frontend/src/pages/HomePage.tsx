import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Bell, Check, ChevronRight, Loader2, PartyPopper, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { UserAvatar } from "@/components/UserAvatar"
import { CategoryIcon } from "@/components/CategoryIcon"
import { Card } from "@/components/ui/card"
import { RemindButton } from "@/components/payments/RemindButton"
import { getDebts, getGroups, overallBalance as sumBalances } from "@/lib/api"
import { useAuthStore } from "@/store/authStore"
import { useFormatCurrency } from "@/store/settingsStore"
import { useNotificationsStore } from "@/store/notificationsStore"
import type { DebtItem, DebtsOverview, Group } from "@/lib/types"

/**
 * Inicio (UX-06): balance total, y justo debajo "Debes" (con Pagar) y
 * "Te deben" (con Recordar), por persona y grupo. Después, tus grupos.
 */
export function HomePage() {
  const user = useAuthStore((s) => s.user)!
  const formatCurrency = useFormatCurrency()
  const [groups, setGroups] = useState<Group[] | null>(null)
  const [debts, setDebts] = useState<DebtsOverview | null>(null)
  const [error, setError] = useState(false)
  const pendingRequests = useNotificationsStore((s) => s.friendRequests)
  const totalDebt = useNotificationsStore((s) => s.totalDebt)
  const paymentsToConfirm = useNotificationsStore((s) => s.paymentsToConfirm)
  // Cambia cuando llega un aviso en tiempo real (gasto nuevo, te agregaron a un grupo…).
  const lastNoticeAt = useNotificationsStore((s) => s.lastNotice?.at)

  useEffect(() => {
    let cancelled = false
    Promise.all([getGroups(), getDebts()])
      .then(([g, d]) => {
        if (cancelled) return
        setGroups(g)
        setDebts(d)
      })
      .catch((err: Error) => {
        if (cancelled) return
        setError(true)
        toast.error(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [user.id, totalDebt, paymentsToConfirm, lastNoticeAt])

  const overallBalance = groups ? sumBalances(groups) : 0
  const isPositive = overallBalance >= 0
  const visibleGroups = groups?.filter((g) => !g.isQuick)
  const where = (d: DebtItem) => (d.group.isQuick ? "Cuenta sin grupo" : d.group.name)

  return (
    <div className="flex flex-col gap-6 bg-ice/40 px-5 pb-6 pt-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Hola,</p>
          <h1 className="text-xl font-bold text-foreground">{user.name.split(" ")[0]}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/activity"
            className="flex size-11 items-center justify-center rounded-2xl bg-card text-foreground shadow-sm"
            aria-label="Actividad"
          >
            <Bell className="size-5" />
          </Link>
          <Link to="/profile" aria-label="Perfil">
            <UserAvatar user={user} />
          </Link>
        </div>
      </header>

      <Card className="bg-linear-to-br from-primary to-accent-sky-hover p-6 text-primary-foreground">
        <p className="text-sm font-medium text-primary-foreground/80">Balance total</p>
        <p className="mt-1 text-4xl font-bold tracking-tight">{formatCurrency(Math.abs(overallBalance))}</p>
        <p className="mt-2 text-sm text-primary-foreground/90">
          {overallBalance === 0
            ? "Estás al día con todos"
            : isPositive
              ? "En total te deben dinero"
              : "En total debes dinero"}
        </p>
      </Card>

      {paymentsToConfirm > 0 && (
        <Link to="/groups">
          <Card className="flex items-center gap-3 border-primary/40 p-4">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-success/15 text-success">
              <Check className="size-5" />
            </span>
            <p className="flex-1 text-sm font-medium text-foreground">
              {paymentsToConfirm === 1
                ? "Alguien registró un pago a tu favor. Confírmalo cuando lo recibas."
                : `Tienes ${paymentsToConfirm} pagos por confirmar`}
            </p>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Card>
        </Link>
      )}

      {debts && debts.owe.length > 0 && (
        <section className="flex flex-col gap-2" aria-labelledby="owe-title">
          <h2 id="owe-title" className="text-base font-semibold text-foreground">
            Debes
          </h2>
          <Card className="flex flex-col divide-y divide-border p-1" data-testid="home-owe">
            {debts.owe.map((d) => (
              <div key={`${d.group.id}-${d.user.id}`} className="flex items-center gap-3 p-3">
                <UserAvatar user={d.user} className="size-10" />
                <Link to={`/groups/${d.group.id}`} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{d.user.name.split(" ")[0]}</p>
                  <p className="truncate text-xs text-muted-foreground">{where(d)}</p>
                </Link>
                <span className="text-sm font-bold text-destructive">{formatCurrency(d.amount)}</span>
                <Link
                  to={`/groups/${d.group.id}`}
                  state={{ payTo: d.user.id }}
                  aria-label={`Pagar a ${d.user.name.split(" ")[0]} en ${where(d)}`}
                  className="flex h-8 items-center rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground"
                >
                  Pagar
                </Link>
              </div>
            ))}
          </Card>
        </section>
      )}

      {debts && debts.owedToMe.length > 0 && (
        <section className="flex flex-col gap-2" aria-labelledby="owed-title">
          <h2 id="owed-title" className="text-base font-semibold text-foreground">
            Te deben
          </h2>
          <Card className="flex flex-col divide-y divide-border p-1" data-testid="home-owed">
            {debts.owedToMe.map((d) => (
              <div key={`${d.group.id}-${d.user.id}`} className="flex items-center gap-3 p-3">
                <UserAvatar user={d.user} className="size-10" />
                <Link to={`/groups/${d.group.id}`} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{d.user.name.split(" ")[0]}</p>
                  <p className="truncate text-xs text-muted-foreground">{where(d)}</p>
                </Link>
                <span className="text-sm font-bold text-success">{formatCurrency(d.amount)}</span>
                <RemindButton
                  groupId={d.group.id}
                  userId={d.user.id}
                  userName={d.user.name}
                  canRemindAt={d.canRemindAt}
                />
              </div>
            ))}
          </Card>
        </section>
      )}

      {debts && debts.owe.length === 0 && debts.owedToMe.length === 0 && (groups?.length ?? 0) > 0 && (
        <Card className="flex items-center gap-3 p-4" data-testid="home-all-settled">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-success/15 text-success">
            <PartyPopper className="size-5" />
          </span>
          <p className="text-sm font-medium text-foreground">Nadie te debe y no le debes a nadie. ¡Todo en orden!</p>
        </Card>
      )}

      {pendingRequests > 0 && (
        <Link to="/friends">
          <Card className="flex items-center gap-3 p-4">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <UserPlus className="size-5" />
            </span>
            <p className="flex-1 text-sm font-medium text-foreground">
              {pendingRequests === 1
                ? "Tienes 1 solicitud de amistad"
                : `Tienes ${pendingRequests} solicitudes de amistad`}
            </p>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Card>
        </Link>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Tus grupos</h2>
          <Link to="/groups" className="flex items-center py-1 text-sm font-medium text-primary">
            Ver todos <ChevronRight className="size-4" />
          </Link>
        </div>

        {!groups && !error && (
          <div className="flex justify-center py-10 text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
          </div>
        )}

        {error && <p className="text-sm text-destructive">No se pudieron cargar tus grupos. Intenta de nuevo.</p>}

        {visibleGroups?.length === 0 && (
          <Card className="flex flex-col items-center gap-3 p-6 text-center text-sm text-muted-foreground">
            <p>Aún no tienes grupos. Registra tu primer almuerzo compartido con el botón +.</p>
            <Link
              to="/add-expense"
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Agregar un gasto
            </Link>
          </Card>
        )}

        <div className="flex flex-col gap-3">
          {visibleGroups?.slice(0, 4).map((group) => {
            const net = group.myBalance
            const members = group.members
            return (
              <Link key={group.id} to={`/groups/${group.id}`}>
                <Card className="flex items-center gap-4 p-4">
                  <CategoryIcon category={group.category} className="size-12" iconClassName="size-6" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">{group.name}</p>
                    <div className="mt-1 flex -space-x-2">
                      {members.slice(0, 4).map((m) => (
                        <UserAvatar key={m.id} user={m} className="size-6 border-2 border-card" />
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${net >= 0 ? "text-success" : "text-destructive"}`}>
                      {net === 0 ? "Al día" : formatCurrency(Math.abs(net))}
                    </p>
                    {net !== 0 && (
                      <p className="text-xs text-muted-foreground">{net >= 0 ? "te deben" : "debes"}</p>
                    )}
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
