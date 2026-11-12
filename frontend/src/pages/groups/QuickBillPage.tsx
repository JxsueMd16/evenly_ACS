import { Link, Navigate, useLocation, useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { BillForm } from "@/components/bill/BillForm"
import { createQuickBill } from "@/lib/api"
import { useAuthStore } from "@/store/authStore"
import type { User } from "@/lib/types"

/**
 * Cuenta con personas sueltas (sin grupo). Las personas se eligen en la
 * pantalla "¿Con quién fue?" (/add-expense); el backend crea un grupo oculto
 * de tipo "cuenta rápida" para guardarla.
 */
export function QuickBillPage() {
  const currentUser = useAuthStore((s) => s.user)!
  const navigate = useNavigate()
  const people = (useLocation().state as { people?: User[] } | null)?.people ?? []

  // Si se entra directo (recargar la página), se vuelve a elegir con quién.
  if (people.length === 0) return <Navigate to="/add-expense" replace />

  const names = people.map((p) => p.name.split(" ")[0]).join(", ")

  return (
    <div className="flex flex-col gap-5 pb-8">
      <header className="flex items-center gap-3 bg-sky/50 px-5 pb-6 pt-6">
        <Link
          to="/add-expense"
          aria-label="Volver a elegir personas"
          className="flex size-11 items-center justify-center rounded-2xl bg-card text-foreground shadow-sm"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-foreground">Nueva cuenta</h1>
          <p className="truncate text-xs text-muted-foreground">Con {names}</p>
        </div>
      </header>

      <BillForm
        members={[currentUser, ...people]}
        currentUserId={currentUser.id}
        onSubmit={async (bill) => {
          const { groupId } = await createQuickBill(
            people.map((p) => p.id),
            bill,
          )
          toast.success("Cuenta guardada")
          navigate(`/groups/${groupId}`, { replace: true })
        }}
      />
    </div>
  )
}
