import { useEffect, useState } from "react"
import { Link, Navigate, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { BillForm } from "@/components/bill/BillForm"
import { addExpense, getGroup } from "@/lib/api"
import { useAuthStore } from "@/store/authStore"
import type { GroupDetail } from "@/lib/types"

/** Nueva cuenta dentro de un grupo: /groups/:groupId/add-expense. */
export function AddExpensePage() {
  const { groupId } = useParams<{ groupId: string }>()
  const currentUser = useAuthStore((s) => s.user)!
  const navigate = useNavigate()
  const [group, setGroup] = useState<GroupDetail | null | undefined>(undefined)

  useEffect(() => {
    if (!groupId) return
    getGroup(groupId)
      .then(setGroup)
      .catch((err: Error) => {
        toast.error(err.message)
        setGroup(null)
      })
  }, [groupId])

  if (group === null) return <Navigate to="/groups" replace />

  return (
    <div className="flex flex-col gap-5 pb-8">
      <header className="flex items-center gap-3 bg-pink/40 px-5 pb-6 pt-6">
        <Link
          to={groupId ? `/groups/${groupId}` : "/groups"}
          aria-label="Volver al grupo"
          className="flex size-9 items-center justify-center rounded-2xl bg-card text-foreground shadow-sm"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-foreground">Nueva cuenta</h1>
          {group && <p className="text-xs text-muted-foreground">{group.name}</p>}
        </div>
      </header>

      {group === undefined ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : (
        <BillForm
          members={group.members}
          currentUserId={currentUser.id}
          onSubmit={async (bill) => {
            await addExpense({ groupId: group.id, ...bill })
            toast.success("Cuenta guardada")
            navigate(`/groups/${group.id}`, { replace: true })
          }}
        />
      )}
    </div>
  )
}
