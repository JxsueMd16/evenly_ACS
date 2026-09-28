import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { Link2Off, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CategoryIcon } from "@/components/CategoryIcon"
import { getInvitePreview, joinByInvite } from "@/lib/api"
import type { InvitePreview } from "@/lib/types"

/** Pantalla que abre un enlace de invitación: /join/<código>. */
export function JoinGroupPage() {
  const { code = "" } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const [preview, setPreview] = useState<InvitePreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isJoining, setIsJoining] = useState(false)

  useEffect(() => {
    getInvitePreview(code)
      .then(setPreview)
      .catch((err: Error) => setError(err.message))
  }, [code])

  async function handleJoin() {
    setIsJoining(true)
    try {
      const { groupId } = await joinByInvite(code)
      toast.success(`Te uniste a "${preview?.group.name}"`)
      navigate(`/groups/${groupId}`, { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo unir al grupo.")
      setIsJoining(false)
    }
  }

  return (
    <div className="flex min-h-full flex-col justify-center gap-6 bg-sky/30 px-5 py-10">
      {!preview && !error && (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      )}

      {error && (
        <Card className="flex flex-col items-center gap-3 p-8 text-center">
          <Link2Off className="size-10 text-muted-foreground" />
          <p className="font-semibold text-foreground">No pudimos abrir la invitación</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Link to="/groups" className="text-sm font-semibold text-primary">
            Ir a tus grupos
          </Link>
        </Card>
      )}

      {preview && (
        <Card className="flex flex-col items-center gap-4 p-8 text-center">
          <p className="text-sm text-muted-foreground">Te invitaron a unirte a</p>
          <CategoryIcon category={preview.group.category} className="size-16" iconClassName="size-8" />
          <div>
            <h1 className="text-xl font-bold text-foreground">{preview.group.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {preview.group.memberCount} integrantes: {preview.group.memberNames.join(", ")}
              {preview.group.memberCount > preview.group.memberNames.length && " y más"}
            </p>
          </div>

          {preview.alreadyMember ? (
            <>
              <p className="text-sm text-foreground">Ya eres parte de este grupo.</p>
              <Button className="w-full" onClick={() => navigate(`/groups/${preview.group.id}`, { replace: true })}>
                Ir al grupo
              </Button>
            </>
          ) : (
            <>
              <Button className="w-full" size="lg" onClick={handleJoin} disabled={isJoining}>
                {isJoining && <Loader2 className="animate-spin" />}
                Unirme al grupo
              </Button>
              <Link to="/" className="text-sm font-medium text-muted-foreground">
                Ahora no
              </Link>
            </>
          )}
        </Card>
      )}
    </div>
  )
}
