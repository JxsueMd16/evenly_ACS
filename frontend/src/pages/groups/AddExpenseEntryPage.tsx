import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ChevronRight, Loader2, Plus, Zap } from "lucide-react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { CategoryIcon } from "@/components/CategoryIcon"
import { getGroups } from "@/lib/api"
import type { Group } from "@/lib/types"

/** Pantalla del botón "+": cuenta rápida o nueva cuenta dentro de un grupo. */
export function AddExpenseEntryPage() {
  const [groups, setGroups] = useState<Group[] | null>(null)

  useEffect(() => {
    getGroups()
      .then((all) => setGroups(all.filter((g) => !g.isQuick)))
      .catch((err: Error) => toast.error(err.message))
  }, [])

  return (
    <div className="flex flex-col gap-5 px-5 pb-6 pt-6">
      <header>
        <h1 className="text-xl font-bold text-foreground">Nueva cuenta</h1>
        <p className="text-sm text-muted-foreground">Divide una cuenta con tu grupo o con quien quieras</p>
      </header>

      <Link to="/quick-bill">
        <Card className="flex items-center gap-4 bg-linear-to-br from-primary to-accent-sky-hover p-4 text-primary-foreground">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-white/20">
            <Zap className="size-5" />
          </span>
          <div className="flex-1">
            <p className="font-semibold">Cuenta rápida</p>
            <p className="text-xs text-primary-foreground/85">Sin crear un grupo: elige a las personas y listo</p>
          </div>
          <ChevronRight className="size-5" />
        </Card>
      </Link>

      <section className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">En un grupo</h2>
          <Link
            to="/groups"
            state={{ openCreate: true }}
            className="flex items-center gap-1 text-sm font-medium text-primary"
          >
            <Plus className="size-4" /> Nuevo grupo
          </Link>
        </div>

        {!groups && (
          <div className="flex justify-center py-10 text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
          </div>
        )}

        {groups?.length === 0 && (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            Aún no tienes grupos. Crea uno (por ejemplo "Universidad" o "Depa") para llevar varias cuentas con las
            mismas personas.
          </Card>
        )}

        {groups?.map((group) => (
          <Link key={group.id} to={`/groups/${group.id}/add-expense`}>
            <Card className="flex items-center gap-4 p-4">
              <CategoryIcon category={group.category} className="size-11" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-foreground">{group.name}</p>
                <p className="text-xs text-muted-foreground">{group.members.length} integrantes</p>
              </div>
              <ChevronRight className="size-5 text-muted-foreground" />
            </Card>
          </Link>
        ))}
      </section>
    </div>
  )
}
