import { useEffect, useState } from "react"
import { Banknote, Check, Image as ImageIcon, Landmark, Loader2, X } from "lucide-react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cancelPayment, getPaymentEvidence, respondToPayment } from "@/lib/api"
import type { Payment, User } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useFormatCurrency } from "@/store/settingsStore"

const STATUS = {
  PENDIENTE: { label: "Por confirmar", className: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  CONFIRMADO: { label: "Confirmado", className: "bg-success/15 text-success" },
  RECHAZADO: { label: "Rechazado", className: "bg-destructive/15 text-destructive" },
} as const

/**
 * Pagos del grupo: arriba los que el usuario debe confirmar (paso 2) y abajo
 * el historial. Quien recibe confirma que le pagaron el monto completo o
 * indica que no lo recibió; quien pagó puede cancelar mientras esté pendiente.
 */
export function GroupPayments({
  groupId,
  payments,
  members,
  currentUserId,
  onChanged,
}: {
  groupId: string
  payments: Payment[]
  members: User[]
  currentUserId: string
  onChanged: () => void
}) {
  const formatCurrency = useFormatCurrency()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [evidenceOf, setEvidenceOf] = useState<Payment | null>(null)

  const nameOf = (id: string) =>
    id === currentUserId ? "Tú" : (members.find((m) => m.id === id)?.name.split(" ")[0] ?? "Ex integrante")
  const toConfirm = payments.filter((p) => p.status === "PENDIENTE" && p.toUserId === currentUserId)

  async function run(id: string, action: () => Promise<unknown>, success: string) {
    setBusyId(id)
    try {
      await action()
      toast.success(success)
      onChanged()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo completar la acción.")
    } finally {
      setBusyId(null)
    }
  }

  const methodIcon = (p: Payment) =>
    p.method === "EFECTIVO" ? <Banknote className="size-3.5" /> : <Landmark className="size-3.5" />
  const methodLabel = (p: Payment) => (p.method === "EFECTIVO" ? "Efectivo" : "Transferencia")

  if (payments.length === 0) return null

  return (
    <>
      {toConfirm.length > 0 && (
        <section className="flex flex-col gap-3 px-5">
          <h2 className="text-base font-semibold text-foreground">Pagos por confirmar</h2>
          {toConfirm.map((p) => (
            <Card key={p.id} className="flex flex-col gap-3 border-primary/40 p-4" data-testid="payment-to-confirm">
              <div>
                <p className="text-sm text-foreground">
                  <span className="font-semibold">{nameOf(p.fromUserId)}</span> dice que te pagó{" "}
                  <span className="font-bold">{formatCurrency(p.amount)}</span>
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  {methodIcon(p)} {methodLabel(p)}
                  {p.note && ` · "${p.note}"`}
                </p>
              </div>
              {p.hasEvidence && (
                <Button variant="ghost" size="sm" className="w-fit" onClick={() => setEvidenceOf(p)}>
                  <ImageIcon /> Ver comprobante
                </Button>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busyId !== null}
                  onClick={() =>
                    run(p.id, () => respondToPayment(groupId, p.id, "reject"), "Indicaste que no recibiste el pago")
                  }
                >
                  <X /> No lo recibí
                </Button>
                <Button
                  size="sm"
                  disabled={busyId !== null}
                  onClick={() =>
                    run(p.id, () => respondToPayment(groupId, p.id, "confirm"), "Pago confirmado. Balances actualizados.")
                  }
                >
                  {busyId === p.id ? <Loader2 className="animate-spin" /> : <Check />}
                  Recibido completo
                </Button>
              </div>
            </Card>
          ))}
        </section>
      )}

      <section className="flex flex-col gap-3 px-5">
        <h2 className="text-base font-semibold text-foreground">Pagos</h2>
        <Card className="flex flex-col divide-y divide-border p-1">
          {payments.map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-3" data-testid="payment-row">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground">
                  <span className="font-medium">{nameOf(p.fromUserId)}</span> →{" "}
                  <span className="font-medium">{nameOf(p.toUserId)}</span>
                </p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  {methodIcon(p)} {methodLabel(p)} ·{" "}
                  {new Date(p.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                  {p.hasEvidence && (p.fromUserId === currentUserId || p.toUserId === currentUserId) && (
                    <button
                      type="button"
                      onClick={() => setEvidenceOf(p)}
                      className="ml-1 font-medium text-primary"
                    >
                      comprobante
                    </button>
                  )}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-sm font-bold text-foreground">{formatCurrency(p.amount)}</span>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", STATUS[p.status].className)}>
                  {STATUS[p.status].label}
                </span>
              </div>
              {p.status === "PENDIENTE" && p.fromUserId === currentUserId && (
                <button
                  type="button"
                  disabled={busyId !== null}
                  onClick={() => run(p.id, () => cancelPayment(groupId, p.id), "Pago cancelado")}
                  aria-label="Cancelar pago"
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          ))}
        </Card>
      </section>

      {evidenceOf && (
        <EvidenceDialog groupId={groupId} payment={evidenceOf} onOpenChange={(open) => !open && setEvidenceOf(null)} />
      )}
    </>
  )
}

function EvidenceDialog({
  groupId,
  payment,
  onOpenChange,
}: {
  groupId: string
  payment: Payment
  onOpenChange: (open: boolean) => void
}) {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let objectUrl: string | null = null
    getPaymentEvidence(groupId, payment.id)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      })
      .catch((err: Error) => setError(err.message))
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [groupId, payment.id])

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Comprobante de pago</DialogTitle>
        </DialogHeader>
        <div className="mt-4 flex justify-center">
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!url && !error && <Loader2 className="size-6 animate-spin text-muted-foreground" />}
          {url && <img src={url} alt="Comprobante de pago" className="max-h-[65dvh] rounded-2xl" />}
        </div>
      </DialogContent>
    </Dialog>
  )
}
