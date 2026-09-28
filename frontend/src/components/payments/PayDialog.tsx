import { useEffect, useRef, useState, type FormEvent } from "react"
import { Banknote, Copy, ImagePlus, Landmark, Loader2, X } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { createPayment, getUserPaymentInfo, uploadPaymentEvidence } from "@/lib/api"
import { sanitizeAmount, toCents } from "@/lib/bill"
import { compressImage } from "@/lib/image"
import { copyText } from "@/lib/share"
import { ACCOUNT_TYPE_LABEL, PREFERENCE_LABEL } from "@/lib/paymentLabels"
import type { PaymentInfo, PaymentMethod, User } from "@/lib/types"
import { useFormatCurrency, useSettingsStore } from "@/store/settingsStore"

/**
 * Paso 1 del pago: quien debe registra que pagó (monto, efectivo o
 * transferencia y comprobante opcional). Queda pendiente hasta que quien
 * recibe lo confirme.
 */
export function PayDialog({
  groupId,
  receiver,
  suggestedAmount,
  maxAmount,
  onOpenChange,
  onPaid,
}: {
  groupId: string
  receiver: User
  suggestedAmount: number
  maxAmount: number
  onOpenChange: (open: boolean) => void
  onPaid: () => void
}) {
  const formatCurrency = useFormatCurrency()
  const currency = useSettingsStore((s) => s.currency)
  const [info, setInfo] = useState<PaymentInfo | null>(null)
  const [amount, setAmount] = useState(suggestedAmount.toFixed(2))
  const [method, setMethod] = useState<PaymentMethod>("TRANSFERENCIA")
  const [note, setNote] = useState("")
  const [evidence, setEvidence] = useState<{ blob: Blob; url: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getUserPaymentInfo(receiver.id)
      .then((data) => {
        setInfo(data)
        if (data.preference === "EFECTIVO") setMethod("EFECTIVO")
      })
      .catch(() => setInfo({ userId: receiver.id, name: receiver.name, preference: "AMBOS", accounts: [] }))
  }, [receiver.id, receiver.name])

  // Libera la vista previa del comprobante al cambiarlo o cerrar.
  useEffect(
    () => () => {
      if (evidence) URL.revokeObjectURL(evidence.url)
    },
    [evidence],
  )

  async function handleFile(file: File | undefined) {
    if (!file) return
    try {
      const blob = await compressImage(file)
      setEvidence({ blob, url: URL.createObjectURL(blob) })
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo usar esa imagen.")
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const cents = toCents(amount)
    if (cents <= 0) return setError("Ingresa el monto que pagaste.")
    if (cents > Math.round(maxAmount * 100)) return setError(`No puedes pagar más de lo que debes (${formatCurrency(maxAmount)}).`)

    setIsSubmitting(true)
    try {
      const payment = await createPayment(groupId, {
        toUserId: receiver.id,
        amount: cents / 100,
        method,
        ...(note.trim() && { note: note.trim() }),
      })
      if (evidence) {
        try {
          await uploadPaymentEvidence(groupId, payment.id, evidence.blob)
        } catch {
          toast.error("El pago se registró, pero no se pudo subir el comprobante.")
        }
      }
      toast.success(`Pago registrado. ${receiver.name.split(" ")[0]} debe confirmar que lo recibió.`)
      onPaid()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el pago.")
      setIsSubmitting(false)
    }
  }

  async function copy(value: string) {
    try {
      await copyText(value)
      toast.success("Número de cuenta copiado")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo copiar.")
    }
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pagar a {receiver.name}</DialogTitle>
          <DialogDescription>
            {info ? PREFERENCE_LABEL[info.preference] : "Cargando datos de pago…"}. Le debes{" "}
            {formatCurrency(maxAmount)} en este grupo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pay-amount">Monto pagado</Label>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-muted-foreground">{currency}</span>
              <Input
                id="pay-amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(sanitizeAmount(e.target.value))}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>¿Cómo pagaste?</Label>
            <ToggleGroup type="single" value={method} onValueChange={(v) => v && setMethod(v as PaymentMethod)}>
              <ToggleGroupItem value="EFECTIVO">
                <Banknote className="size-4" /> Efectivo
              </ToggleGroupItem>
              <ToggleGroupItem value="TRANSFERENCIA">
                <Landmark className="size-4" /> Transferencia
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {method === "TRANSFERENCIA" && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-muted-foreground">Cuentas de {receiver.name.split(" ")[0]}</p>
              {info && info.accounts.length === 0 && (
                <p className="rounded-2xl bg-muted/60 p-3 text-xs text-muted-foreground">
                  {receiver.name.split(" ")[0]} no ha registrado cuentas bancarias visibles. Pídele sus datos.
                </p>
              )}
              {info?.accounts.map((account) => (
                <div key={account.id} className="flex items-center gap-3 rounded-2xl border border-border p-3" data-testid="receiver-account">
                  <Landmark className="size-5 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {account.bank} · {ACCOUNT_TYPE_LABEL[account.type]}
                    </p>
                    <p className="font-mono text-sm text-foreground">{account.number}</p>
                    <p className="truncate text-xs text-muted-foreground">{account.holder}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copy(account.number)}
                    aria-label={`Copiar cuenta ${account.number}`}
                    className="rounded-full p-2 text-muted-foreground hover:bg-muted"
                  >
                    <Copy className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label>Comprobante (opcional)</Label>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              data-testid="evidence-input"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            {evidence ? (
              <div className="relative w-fit">
                <img src={evidence.url} alt="Comprobante" className="max-h-40 rounded-2xl border border-border" />
                <button
                  type="button"
                  onClick={() => setEvidence(null)}
                  aria-label="Quitar comprobante"
                  className="absolute -right-2 -top-2 rounded-full bg-card p-1 shadow"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <Button type="button" variant="outline" onClick={() => fileInput.current?.click()}>
                <ImagePlus /> Adjuntar foto o captura
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pay-note">Nota (opcional)</Label>
            <Input
              id="pay-note"
              placeholder="Ej. Transferí desde BI"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            Registrar pago
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
