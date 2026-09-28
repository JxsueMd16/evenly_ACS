import { useEffect, useState } from "react"
import { Copy, Loader2, RefreshCw, Share2 } from "lucide-react"
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
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { getInviteCode, inviteUrl, regenerateInviteCode } from "@/lib/api"
import { copyText, shareLink } from "@/lib/share"
import type { GroupDetail } from "@/lib/types"

/**
 * Enlace de invitación al grupo. Cualquier integrante puede copiarlo o
 * compartirlo; el admin puede generar uno nuevo para invalidar el anterior.
 */
export function InviteDialog({
  group,
  isAdmin,
  open,
  onOpenChange,
}: {
  group: GroupDetail
  isAdmin: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [code, setCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmRegenerate, setConfirmRegenerate] = useState(false)

  useEffect(() => {
    if (!open || code) return
    let cancelled = false
    getInviteCode(group.id)
      .then((c) => !cancelled && setCode(c))
      .catch((err: Error) => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
  }, [open, code, group.id])

  const url = code ? inviteUrl(code) : ""

  async function handleCopy() {
    try {
      await copyText(url)
      toast.success("Enlace copiado")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo copiar el enlace.")
    }
  }

  async function handleShare() {
    try {
      const result = await shareLink({
        title: `Únete a "${group.name}" en Evenly`,
        text: `Te invito al grupo "${group.name}" en Evenly para dividir los gastos.`,
        url,
      })
      if (result === "copied") toast.success("Enlace copiado. Pégalo en WhatsApp o donde quieras.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo compartir el enlace.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invitar al grupo</DialogTitle>
          <DialogDescription>
            Cualquiera con este enlace puede unirse a "{group.name}" después de iniciar sesión o crear su cuenta.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 flex flex-col gap-3">
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!code && !error && (
            <div className="flex justify-center py-4 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
            </div>
          )}
          {code && (
            <>
              <Input
                readOnly
                value={url}
                aria-label="Enlace de invitación"
                onFocus={(e) => e.currentTarget.select()}
                className="text-xs"
              />
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={handleCopy}>
                  <Copy /> Copiar
                </Button>
                <Button onClick={handleShare}>
                  <Share2 /> Compartir
                </Button>
              </div>
              {isAdmin && (
                <Button variant="ghost" size="sm" onClick={() => setConfirmRegenerate(true)}>
                  <RefreshCw /> Generar un enlace nuevo
                </Button>
              )}
            </>
          )}
        </div>

        {confirmRegenerate && (
          <ConfirmDialog
            open
            onOpenChange={(next) => !next && setConfirmRegenerate(false)}
            title="Generar un enlace nuevo"
            description="El enlace actual dejará de funcionar. Quienes ya se unieron siguen en el grupo."
            confirmLabel="Generar"
            onConfirm={async () => {
              setCode(await regenerateInviteCode(group.id))
              toast.success("Enlace nuevo generado")
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
