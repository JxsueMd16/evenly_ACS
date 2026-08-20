import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Bell, ChevronRight, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { UserAvatar } from "@/components/UserAvatar"
import { CategoryIcon } from "@/components/CategoryIcon"
import { Card } from "@/components/ui/card"
import { computeUserNetByGroup, computeUserOverallBalance, getGroupMembers, getGroupsForUser } from "@/lib/mockApi"
import { useAuthStore } from "@/store/authStore"
import { useFormatCurrency } from "@/store/settingsStore"
import type { Group } from "@/lib/types"

export function HomePage() {
  const user = useAuthStore((s) => s.user)!
  const formatCurrency = useFormatCurrency()
  const [groups, setGroups] = useState<Group[] | null>(null)
  const [netByGroup, setNetByGroup] = useState<Record<string, number>>({})
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    getGroupsForUser(user.id)
      .then((data) => {
        if (cancelled) return
        setGroups(data)
        setNetByGroup(computeUserNetByGroup(user.id))
      })
      .catch(() => {
        if (cancelled) return
        setError(true)
        toast.error("No se pudieron cargar tus grupos.")
      })
    return () => {
      cancelled = true
    }
  }, [user.id])

  const overallBalance = computeUserOverallBalance(user.id)
  const isPositive = overallBalance >= 0

  return (
    <div className="flex flex-col gap-6 bg-ice/40 px-5 pb-6 pt-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Hola,</p>
          <h1 className="text-xl font-bold text-foreground">{user.name.split(" ")[0]}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-2xl bg-card text-foreground shadow-sm"
            aria-label="Notificaciones"
          >
            <Bell className="size-5" />
          </button>
          <Link to="/profile">
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

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Tus grupos</h2>
          <Link to="/groups" className="flex items-center text-sm font-medium text-primary">
            Ver todos <ChevronRight className="size-4" />
          </Link>
        </div>

        {!groups && !error && (
          <div className="flex justify-center py-10 text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
          </div>
        )}

        {error && <p className="text-sm text-destructive">No se pudieron cargar tus grupos. Intenta de nuevo.</p>}

        {groups?.length === 0 && (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            Aún no perteneces a ningún grupo. ¡Crea uno para empezar a compartir gastos!
          </Card>
        )}

        <div className="flex flex-col gap-3">
          {groups?.slice(0, 4).map((group) => {
            const net = netByGroup[group.id] ?? 0
            const members = getGroupMembers(group)
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
