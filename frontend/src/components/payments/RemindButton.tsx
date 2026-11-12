import { useState } from "react"
import { BellRing, Check, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { remindDebt } from "@/lib/api"
import { cn } from "@/lib/utils"

/** "Recordar" un cobro (UX-08). El servidor limita a uno por deuda cada 24 h. */
export function RemindButton({
  groupId,
  userId,
  userName,
  canRemindAt = null,
  className,
}: {
  groupId: string
  userId: string
  userName: string
  /** Si viene con fecha, ya se envió uno y no se puede repetir hasta entonces. */
  canRemindAt?: string | null
  className?: string
}) {
  const [blockedUntil, setBlockedUntil] = useState<string | null>(canRemindAt)
  const [sending, setSending] = useState(false)
  const firstName = userName.split(" ")[0]

  async function remind() {
    setSending(true)
    try {
      const { canRemindAt: next } = await remindDebt(groupId, userId)
      setBlockedUntil(next)
      toast.success(`Le recordamos a ${firstName}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo enviar el recordatorio.")
    } finally {
      setSending(false)
    }
  }

  if (blockedUntil) {
    const when = new Date(blockedUntil).toLocaleString("es-GT", { weekday: "short", hour: "numeric", minute: "2-digit" })
    return (
      <span
        className={cn("flex items-center gap-1 text-[11px] text-muted-foreground", className)}
        title={`Podrás recordarle otra vez el ${when}`}
        data-testid={`reminded-${userId}`}
      >
        <Check className="size-3.5" /> Recordado
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={remind}
      disabled={sending}
      aria-label={`Recordar a ${userName}`}
      className={cn(
        "flex h-8 items-center gap-1 rounded-full border border-primary px-3 text-xs font-semibold text-primary disabled:opacity-60",
        className,
      )}
    >
      {sending ? <Loader2 className="size-3.5 animate-spin" /> : <BellRing className="size-3.5" />} Recordar
    </button>
  )
}
