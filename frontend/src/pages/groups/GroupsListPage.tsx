import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { CategoryIcon } from "@/components/CategoryIcon"
import { computeUserNetByGroup, getGroupMembers, getGroupsForUser } from "@/lib/mockApi"
import { useAuthStore } from "@/store/authStore"
import { useFormatCurrency } from "@/store/settingsStore"
import type { Group } from "@/lib/types"
import { CreateGroupDialog } from "./CreateGroupDialog"

export function GroupsListPage() {
  const user = useAuthStore((s) => s.user)!
  const formatCurrency = useFormatCurrency()
  const [groups, setGroups] = useState<Group[] | null>(null)
  const [netByGroup, setNetByGroup] = useState<Record<string, number>>({})
  const [dialogOpen, setDialogOpen] = useState(false)

  function reload() {
    getGroupsForUser(user.id)
      .then((data) => {
        setGroups(data)
        setNetByGroup(computeUserNetByGroup(user.id))
      })
      .catch(() => toast.error("No se pudieron cargar tus grupos."))
  }

  useEffect(reload, [user.id])

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

      {!groups && (
        <div className="flex justify-center py-10 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      )}

      {groups?.length === 0 && (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Todavía no tienes grupos. Crea el primero para empezar a dividir gastos.
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {groups?.map((group) => {
          const net = netByGroup[group.id] ?? 0
          const members = getGroupMembers(group)
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

      <CreateGroupDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={() => {
          reload()
          toast.success("Grupo creado")
        }}
      />
    </div>
  )
}
