import { useEffect, useState } from "react"
import { ChevronRight, HelpCircle, Loader2, LogOut, Settings } from "lucide-react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/UserAvatar"
import { CategoryIcon } from "@/components/CategoryIcon"
import { SettingsDialog } from "@/pages/SettingsDialog"
import { PaymentProfileSection } from "@/components/payments/PaymentProfileSection"
import { getGroups, getPaymentHistory, overallBalance as sumBalances } from "@/lib/api"
import type { ActivityItem } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/authStore"
import { useFormatCurrency } from "@/store/settingsStore"

export function ProfilePage() {
  const user = useAuthStore((s) => s.user)!
  const logout = useAuthStore((s) => s.logout)
  const formatCurrency = useFormatCurrency()
  const [history, setHistory] = useState<ActivityItem[] | null>(null)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [overallBalance, setOverallBalance] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    getPaymentHistory()
      .then(setHistory)
      .catch((err: Error) => {
        setHistoryError(err.message)
        toast.error(err.message)
      })
    getGroups()
      .then((groups) => setOverallBalance(sumBalances(groups)))
      .catch(() => {
        // El historial ya muestra el error; el balance queda en 0.
      })
  }, [])

  function handleLogout() {
    // Don't navigate here: clearing `user` makes ProtectedRoute redirect to
    // /login on its own. Navigating manually too raced with that redirect
    // and could leave a stale `from` location in router state.
    logout()
    toast.success("Sesión cerrada")
  }

  return (
    <div className="flex flex-col gap-6 bg-pink/30 px-5 pb-6 pt-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <UserAvatar user={user} className="size-20 text-xl" />
        <div>
          <h1 className="text-xl font-bold text-foreground">{user.name}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold",
            overallBalance === 0
              ? "bg-accent-sky/15 text-accent-sky-hover"
              : overallBalance > 0
                ? "bg-success/15 text-success"
                : "bg-destructive/15 text-destructive",
          )}
        >
          {overallBalance === 0
            ? "Al día en todos tus grupos"
            : overallBalance > 0
              ? `Te deben ${formatCurrency(overallBalance)}`
              : `Debes ${formatCurrency(Math.abs(overallBalance))}`}
        </span>
      </div>

      <PaymentProfileSection />

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-foreground">Cuentas que pagaste</h2>

        {historyError && <p className="text-sm text-destructive">{historyError}</p>}

        {!history && !historyError && (
          <div className="flex justify-center py-8 text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
          </div>
        )}

        {history?.length === 0 && (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            Todavía no has pagado ningún gasto.
          </Card>
        )}

        <div className="flex flex-col gap-2.5">
          {history?.map(({ expense, group }) => (
            <Card key={expense.id} className="flex items-center gap-3 p-3.5">
              <CategoryIcon category={expense.category} className="size-10" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{expense.description}</p>
                <p className="text-xs text-muted-foreground">{group.name}</p>
              </div>
              <p className="text-sm font-bold text-foreground">{formatCurrency(expense.amount)}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <Card className="flex flex-col divide-y divide-border p-1">
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-3 p-3.5 text-left"
          >
            <Settings className="size-4 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium text-foreground">Ajustes</span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
          <button type="button" className="flex items-center gap-3 p-3.5 text-left">
            <HelpCircle className="size-4 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium text-foreground">Ayuda y preguntas frecuentes</span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
        </Card>

        <Button variant="outline" onClick={handleLogout} className="mt-2 text-destructive">
          <LogOut className="size-4" /> Cerrar sesión
        </Button>
      </section>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  )
}
