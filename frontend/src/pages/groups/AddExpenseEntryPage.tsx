import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ChevronRight, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { CategoryIcon } from "@/components/CategoryIcon"
import { getGroupsForUser } from "@/lib/mockApi"
import { useAuthStore } from "@/store/authStore"
import type { Group } from "@/lib/types"

export function AddExpenseEntryPage() {
  const user = useAuthStore((s) => s.user)!
  const [groups, setGroups] = useState<Group[] | null>(null)

  useEffect(() => {
    getGroupsForUser(user.id)
      .then(setGroups)
      .catch(() => toast.error("No se pudieron cargar tus grupos."))
  }, [user.id])

  return (
    <div className="flex flex-col gap-5 px-5 pb-6 pt-6">
      <header>
        <h1 className="text-xl font-bold text-foreground">Agregar gasto</h1>
        <p className="text-sm text-muted-foreground">Elige a qué grupo pertenece</p>
      </header>

      {!groups && (
        <div className="flex justify-center py-10 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      )}

      {groups?.length === 0 && (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Necesitas un grupo antes de registrar un gasto. Crea uno desde la pestaña Grupos.
        </Card>
      )}

      <div className="flex flex-col gap-2.5">
        {groups?.map((group) => (
          <Link key={group.id} to={`/groups/${group.id}/add-expense`}>
            <Card className="flex items-center gap-4 p-4">
              <CategoryIcon category={group.category} className="size-11" />
              <p className="flex-1 font-semibold text-foreground">{group.name}</p>
              <ChevronRight className="size-5 text-muted-foreground" />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
