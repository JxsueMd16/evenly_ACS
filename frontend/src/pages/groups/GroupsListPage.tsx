import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Loader2, Plus, Zap } from "lucide-react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { CategoryIcon } from "@/components/CategoryIcon"
import { getGroups } from "@/lib/api"
import { useAuthStore } from "@/store/authStore"
import { useFormatCurrency } from "@/store/settingsStore"
import { useNotificationsStore } from "@/store/notificationsStore"
import type { Group } from "@/lib/types"
import { CreateGroupDialog } from "./CreateGroupDialog"

export function GroupsListPage() {
  const user = useAuthStore((s) => s.user)!
  const formatCurrency = useFormatCurrency()
  const [groups, setGroups] = useState<Group[] | null>(null)
  const location = useLocation()
  const navigate = useNavigate()
  // Desde el botón "+" se llega con { openCreate: true } para abrir el diálogo directo.
  const [dialogOpen, setDialogOpen] = useState(
    () => (location.state as { openCreate?: boolean } | null)?.openCreate === true,
  )

  const [error, setError] = useState<string | null>(null)

  function reload() {
    getGroups()
      .then((data) => {
        setGroups(data)
        setError(null)
      })
      .catch((err: Error) => {
        setError(err.message)
        toast.error(err.message)
      })
  }

  // Se recarga cuando cambian las deudas o llega un aviso (te agregaron a un grupo, gasto nuevo…).
  const totalDebt = useNotificationsStore((s) => s.totalDebt)
  const lastNoticeAt = useNotificationsStore((s) => s.lastNotice?.at)
  useEffect(reload, [user.id, totalDebt, lastNoticeAt])

  return (
    <div className="flex flex-col gap-5 px-5 pb-6 pt-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Tus grupos</h1>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="flex items-center gap-1 rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm"
        >
          <Plus className="size-4" /> Nuevo
        </button>
      </header>

      {!groups && !error && (
        <div className="flex justify-center py-10 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      )}

      {error && !groups && (
        <Card className="flex flex-col items-center gap-3 p-6 text-center text-sm text-destructive">
          {error}
          <button type="button" onClick={reload} className="font-semibold text-primary">
            Reintentar
          </button>
        </Card>
      )}

      {groups?.length === 0 && (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Todavía no tienes grupos. Crea el primero (por ejemplo "Universidad") para llevar varias cuentas con las
          mismas personas.
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {groups?.filter((g) => !g.isQuick).map((group) => {
          const net = group.myBalance
          const members = group.members
          return (
            <Link key={group.id} to={`/groups/${group.id}`}>
              <Card className="flex items-center gap-4 p-4">
                <CategoryIcon category={group.category} className="size-12" iconClassName="size-6" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">{group.name}</p>
                  <p className="text-xs text-muted-foreground">{members.length} integrantes</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${net >= 0 ? "text-success" : "text-destructive"}`}>
                    {net === 0 ? "Al día" : formatCurrency(Math.abs(net))}
                  </p>
                  {net !== 0 && <p className="text-xs text-muted-foreground">{net >= 0 ? "te deben" : "debes"}</p>}
                </div>
              </Card>
            </Link>
          )
        })}
      </div>

      {groups && groups.some((g) => g.isQuick) && (
        <section className="flex flex-col gap-3">
          <h2 className="flex items-center gap-1.5 text-base font-semibold text-foreground">
            <Zap className="size-4 text-primary" /> Cuentas rápidas
          </h2>
          {groups
            .filter((g) => g.isQuick)
            .map((group) => (
              <Link key={group.id} to={`/groups/${group.id}`}>
                <Card className="flex items-center gap-4 p-3.5">
                  <CategoryIcon category={group.category} className="size-10" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{group.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(group.totalSpent)} · {group.members.length} personas
                    </p>
                  </div>
                  <p className={`text-sm font-bold ${group.myBalance >= 0 ? "text-success" : "text-destructive"}`}>
                    {group.myBalance === 0
                      ? "Al día"
                      : `${group.myBalance > 0 ? "+" : "-"}${formatCurrency(Math.abs(group.myBalance))}`}
                  </p>
                </Card>
              </Link>
            ))}
        </section>
      )}

      <CreateGroupDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={(groupId) => {
          toast.success("Grupo creado")
          navigate(`/groups/${groupId}`)
        }}
      />
    </div>
  )
}
