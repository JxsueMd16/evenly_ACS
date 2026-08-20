import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Loader2, Receipt } from "lucide-react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { CategoryIcon } from "@/components/CategoryIcon"
import { getRecentActivity, getUserByIdSync, type ActivityItem } from "@/lib/mockApi"
import { useAuthStore } from "@/store/authStore"
import { useFormatCurrency } from "@/store/settingsStore"

export function ActivityPage() {
  const user = useAuthStore((s) => s.user)!
  const formatCurrency = useFormatCurrency()
  const [items, setItems] = useState<ActivityItem[] | null>(null)

  useEffect(() => {
    getRecentActivity(user.id, 20)
      .then(setItems)
      .catch(() => toast.error("No se pudo cargar tu actividad."))
  }, [user.id])

  return (
    <div className="flex flex-col gap-5 bg-sky/30 px-5 pb-6 pt-6">
      <header>
        <h1 className="text-xl font-bold text-foreground">Actividad</h1>
        <p className="text-sm text-muted-foreground">Últimos movimientos en tus grupos</p>
      </header>

      {!items && (
        <div className="flex justify-center py-10 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      )}

      {items?.length === 0 && (
        <Card className="flex flex-col items-center gap-2 p-8 text-center text-muted-foreground">
          <Receipt className="size-8" />
          <p className="text-sm">Todavía no hay actividad para mostrar.</p>
        </Card>
      )}

      <div className="flex flex-col gap-2.5">
        {items?.map(({ expense, group }) => {
          const payer = getUserByIdSync(expense.paidById)
          return (
            <Link key={expense.id} to={`/groups/${group.id}`}>
              <Card className="flex items-center gap-3 p-3.5">
                <CategoryIcon category={expense.category} className="size-10" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{expense.description}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {group.name} · {payer?.id === user.id ? "Tú pagaste" : `${payer?.name} pagó`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">{formatCurrency(expense.amount)}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(expense.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                  </p>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
