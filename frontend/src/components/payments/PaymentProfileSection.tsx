import { useEffect, useState, type FormEvent } from "react"
import { Banknote, Eye, EyeOff, Landmark, Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import {
  addBankAccount,
  deleteBankAccount,
  getPaymentProfile,
  updateBankAccount,
  updatePaymentPreference,
} from "@/lib/api"
import { ACCOUNT_TYPE_LABEL } from "@/lib/paymentLabels"
import { BANKS, type BankAccount, type PaymentPreference } from "@/lib/types"
import { useAuthStore } from "@/store/authStore"

/**
 * Perfil → "Cómo te pagan": preferencia (efectivo, transferencia o ambos) y
 * cuentas bancarias. Una cuenta visible la ven quienes comparten un grupo o
 * una amistad contigo (al pagarte); una privada solo la ves tú.
 */
export function PaymentProfileSection() {
  const [preference, setPreference] = useState<PaymentPreference | null>(null)
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [toDelete, setToDelete] = useState<BankAccount | null>(null)

  useEffect(() => {
    getPaymentProfile()
      .then((data) => {
        setPreference(data.preference)
        setAccounts(data.accounts)
      })
      .catch((err: Error) => setError(err.message))
  }, [])

  async function changePreference(value: PaymentPreference) {
    const previous = preference
    setPreference(value)
    try {
      await updatePaymentPreference(value)
      toast.success("Preferencia de pago guardada")
    } catch (err) {
      setPreference(previous)
      toast.error(err instanceof Error ? err.message : "No se pudo guardar la preferencia.")
    }
  }

  async function toggleVisible(account: BankAccount) {
    try {
      const updated = await updateBankAccount(account.id, { visible: !account.visible })
      setAccounts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
      toast.success(updated.visible ? "La cuenta ahora es visible para tus grupos" : "La cuenta ahora es privada")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar la cuenta.")
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-semibold text-foreground">Cómo te pagan</h2>
      <Card className="flex flex-col gap-4 p-4">
        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">Prefiero recibir pagos en</p>
          <ToggleGroup
            type="single"
            value={preference ?? undefined}
            onValueChange={(v) => v && changePreference(v as PaymentPreference)}
            aria-label="Preferencia de pago"
          >
            <ToggleGroupItem value="EFECTIVO">
              <Banknote className="size-4" /> Efectivo
            </ToggleGroupItem>
            <ToggleGroupItem value="TRANSFERENCIA">
              <Landmark className="size-4" /> Transferencia
            </ToggleGroupItem>
            <ToggleGroupItem value="AMBOS">Ambos</ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">Mis cuentas bancarias</p>
          {accounts.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Agrega tus cuentas para que tus amigos sepan a dónde transferirte.
            </p>
          )}
          {accounts.map((account) => (
            <div key={account.id} className="flex items-center gap-3 rounded-2xl border border-border p-3" data-testid="bank-account">
              <Landmark className="size-5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {account.bank} · {ACCOUNT_TYPE_LABEL[account.type]}
                </p>
                <p className="font-mono text-sm text-foreground">{account.number}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {account.holder} · {account.visible ? "Visible para tus grupos y amigos" : "Solo tú"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleVisible(account)}
                aria-label={account.visible ? `Hacer privada la cuenta ${account.number}` : `Hacer visible la cuenta ${account.number}`}
                className="rounded-full p-2 text-muted-foreground hover:bg-muted"
              >
                {account.visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
              </button>
              <button
                type="button"
                onClick={() => setToDelete(account)}
                aria-label={`Eliminar cuenta ${account.number}`}
                className="rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
            <Plus /> Agregar cuenta bancaria
          </Button>
        </div>
      </Card>

      {adding && (
        <AddBankAccountDialog
          onOpenChange={setAdding}
          onAdded={(account) => setAccounts((prev) => [...prev, account])}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setToDelete(null)}
          title="Eliminar cuenta bancaria"
          description={`¿Eliminar la cuenta ${toDelete.bank} ${toDelete.number}?`}
          confirmLabel="Eliminar"
          onConfirm={async () => {
            await deleteBankAccount(toDelete.id)
            setAccounts((prev) => prev.filter((a) => a.id !== toDelete.id))
            toast.success("Cuenta eliminada")
          }}
        />
      )}
    </section>
  )
}

function AddBankAccountDialog({
  onOpenChange,
  onAdded,
}: {
  onOpenChange: (open: boolean) => void
  onAdded: (account: BankAccount) => void
}) {
  const userName = useAuthStore((s) => s.user?.name ?? "")
  const [bank, setBank] = useState<BankAccount["bank"]>("Banrural")
  const [type, setType] = useState<BankAccount["type"]>("MONETARIA")
  const [number, setNumber] = useState("")
  const [holder, setHolder] = useState(userName)
  const [visible, setVisible] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!/^[0-9][0-9-]{3,29}$/.test(number.trim())) {
      return setError("El número de cuenta solo puede tener dígitos y guiones (4 a 30).")
    }
    if (!holder.trim()) return setError("Ingresa el nombre del titular.")
    setIsSaving(true)
    try {
      onAdded(await addBankAccount({ bank, type, number: number.trim(), holder: holder.trim(), visible }))
      toast.success("Cuenta agregada")
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo agregar la cuenta.")
      setIsSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva cuenta bancaria</DialogTitle>
          <DialogDescription>Así tus amigos sabrán a dónde transferirte.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bank-name">Banco</Label>
            <select
              id="bank-name"
              value={bank}
              onChange={(e) => setBank(e.target.value as BankAccount["bank"])}
              className="h-11 rounded-2xl border border-input bg-card px-3 text-sm text-foreground outline-none focus-visible:border-primary"
            >
              {BANKS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Tipo de cuenta</Label>
            <ToggleGroup type="single" value={type} onValueChange={(v) => v && setType(v as BankAccount["type"])}>
              <ToggleGroupItem value="MONETARIA">Monetaria</ToggleGroupItem>
              <ToggleGroupItem value="AHORRO">Ahorro</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bank-number">Número de cuenta</Label>
            <Input
              id="bank-number"
              inputMode="numeric"
              placeholder="Ej. 3045-012345-6"
              value={number}
              onChange={(e) => setNumber(e.target.value.replace(/[^0-9-]/g, ""))}
              maxLength={30}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bank-holder">Titular</Label>
            <Input id="bank-holder" value={holder} onChange={(e) => setHolder(e.target.value)} maxLength={80} />
          </div>

          <label className="flex items-start gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={visible}
              onChange={(e) => setVisible(e.target.checked)}
              className="mt-0.5 size-4 accent-[var(--color-primary)]"
            />
            <span>
              Visible para mis grupos y amigos
              <span className="block text-xs text-muted-foreground">
                La verán al pagarte. Si la desmarcas, solo tú la ves.
              </span>
            </span>
          </label>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="animate-spin" />}
            Guardar cuenta
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
