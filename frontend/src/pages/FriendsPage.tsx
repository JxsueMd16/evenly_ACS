import { useCallback, useEffect, useState } from "react"
import { Check, Clock, Loader2, Send, UserMinus, UserPlus, Users, X } from "lucide-react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/UserAvatar"
import { UserSearchField } from "@/components/UserSearchField"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import {
  acceptFriendRequest,
  deleteFriendRequest,
  getFriends,
  removeFriend,
  sendFriendRequest,
} from "@/lib/api"
import { shareLink } from "@/lib/share"
import { useUserSearch } from "@/lib/useUserSearch"
import type { FriendsOverview, User, UserSearchResult } from "@/lib/types"
import { useNotificationsStore } from "@/store/notificationsStore"

export function FriendsPage() {
  const [data, setData] = useState<FriendsOverview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [busyId, setBusyId] = useState<string | null>(null)
  const [friendToRemove, setFriendToRemove] = useState<User | null>(null)
  const search = useUserSearch(query)

  const load = useCallback(
    () =>
      getFriends()
        .then((overview) => {
          setData(overview)
          setError(null)
        })
        .catch((err: Error) => {
          setError(err.message)
          toast.error(err.message)
        }),
    [],
  )

  // Se recarga al abrir y cada vez que llega en tiempo real un cambio de solicitudes.
  const friendRequests = useNotificationsStore((s) => s.friendRequests)
  const lastNoticeAt = useNotificationsStore((s) =>
    s.lastNotice?.kind.startsWith("friend") ? s.lastNotice.at : undefined,
  )
  useEffect(() => {
    load()
  }, [load, friendRequests, lastNoticeAt])

  /** Ejecuta una acción sobre un usuario o solicitud mostrando su spinner y recarga la lista. */
  async function run(id: string, action: () => Promise<unknown>, success: string) {
    setBusyId(id)
    try {
      await action()
      toast.success(success)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo completar la acción.")
    } finally {
      setBusyId(null)
    }
  }

  function handleSearchAction(user: UserSearchResult) {
    if (user.friendship === "none") {
      return run(
        user.id,
        async () => {
          const status = await sendFriendRequest(user.id)
          search.patchResult(user.id, { friendship: status })
        },
        `Solicitud enviada a ${user.name}`,
      )
    }
    if (user.friendship === "incoming" && user.requestId) {
      return run(
        user.id,
        async () => {
          await acceptFriendRequest(user.requestId!)
          search.patchResult(user.id, { friendship: "friends" })
        },
        `Ahora eres amigo de ${user.name}`,
      )
    }
  }

  async function inviteToEvenly() {
    try {
      const result = await shareLink({
        title: "Evenly",
        text: "Únete a Evenly para dividir gastos conmigo",
        url: `${window.location.origin}/register`,
      })
      if (result === "copied") toast.success("Enlace copiado. Pégalo donde quieras compartirlo.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo compartir el enlace.")
    }
  }

  return (
    <div className="flex flex-col gap-6 bg-sky/30 px-5 pb-6 pt-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Amigos</h1>
          <p className="text-sm text-muted-foreground">Agrega amigos para armar grupos más rápido</p>
        </div>
        <Button size="sm" variant="outline" onClick={inviteToEvenly}>
          <Send /> Invitar
        </Button>
      </header>

      <section className="flex flex-col gap-2">
        <label htmlFor="friend-search" className="text-sm font-semibold text-foreground">
          Buscar personas
        </label>
        <UserSearchField
          id="friend-search"
          value={query}
          onChange={setQuery}
          isSearching={search.isSearching}
          noResults={search.canSearch && !search.isSearching && search.results.length === 0}
        />
        {search.error && <p className="text-xs text-destructive">{search.error}</p>}
        {search.results.length > 0 && (
          <Card className="flex flex-col divide-y divide-border p-1">
            {search.results.map((user) => (
              <div key={user.id} className="flex items-center gap-3 p-3">
                <UserAvatar user={user} className="size-10" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">{user.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
                </span>
                <SearchAction user={user} busy={busyId === user.id} onAction={() => handleSearchAction(user)} />
              </div>
            ))}
          </Card>
        )}
      </section>

      {!data && !error && (
        <div className="flex justify-center py-10 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      )}

      {error && !data && (
        <Card className="flex flex-col items-center gap-3 p-6 text-center text-sm text-destructive">
          {error}
          <button type="button" onClick={load} className="font-semibold text-primary">
            Reintentar
          </button>
        </Card>
      )}

      {data && data.incoming.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-foreground">Solicitudes recibidas ({data.incoming.length})</h2>
          <Card className="flex flex-col divide-y divide-border p-1">
            {data.incoming.map((request) => (
              <div key={request.id} className="flex items-center gap-3 p-3">
                <UserAvatar user={request.user} className="size-10" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{request.user.name}</span>
                <Button
                  size="sm"
                  onClick={() =>
                    run(request.id, () => acceptFriendRequest(request.id), `Ahora eres amigo de ${request.user.name}`)
                  }
                  disabled={busyId !== null}
                  aria-label={`Aceptar a ${request.user.name}`}
                >
                  {busyId === request.id ? <Loader2 className="animate-spin" /> : <Check />}
                  Aceptar
                </Button>
                <button
                  type="button"
                  onClick={() => run(request.id, () => deleteFriendRequest(request.id), "Solicitud rechazada")}
                  disabled={busyId !== null}
                  aria-label={`Rechazar a ${request.user.name}`}
                  className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
          </Card>
        </section>
      )}

      {data && (
        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-foreground">Tus amigos ({data.friends.length})</h2>
          {data.friends.length === 0 ? (
            <Card className="flex flex-col items-center gap-2 p-6 text-center text-sm text-muted-foreground">
              <Users className="size-8" />
              Aún no tienes amigos en Evenly. Búscalos por nombre o correo, o invítalos con el botón "Invitar".
            </Card>
          ) : (
            <Card className="flex flex-col divide-y divide-border p-1">
              {data.friends.map((friend) => (
                <div key={friend.id} className="flex items-center gap-3 p-3">
                  <UserAvatar user={friend} className="size-10" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">{friend.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{friend.email}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setFriendToRemove(friend)}
                    aria-label={`Eliminar amistad con ${friend.name}`}
                    className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <UserMinus className="size-4" />
                  </button>
                </div>
              ))}
            </Card>
          )}
        </section>
      )}

      {data && data.outgoing.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-foreground">Solicitudes enviadas</h2>
          <Card className="flex flex-col divide-y divide-border p-1">
            {data.outgoing.map((request) => (
              <div key={request.id} className="flex items-center gap-3 p-3">
                <UserAvatar user={request.user} className="size-10" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{request.user.name}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => run(request.id, () => deleteFriendRequest(request.id), "Solicitud cancelada")}
                  disabled={busyId !== null}
                  aria-label={`Cancelar solicitud a ${request.user.name}`}
                >
                  {busyId === request.id && <Loader2 className="animate-spin" />}
                  Cancelar
                </Button>
              </div>
            ))}
          </Card>
        </section>
      )}

      {friendToRemove && (
        <ConfirmDialog
          open
          onOpenChange={(next) => !next && setFriendToRemove(null)}
          title="Eliminar amistad"
          description={`¿Eliminar a ${friendToRemove.name} de tus amigos? Seguirán compartiendo los grupos que ya tienen en común.`}
          confirmLabel="Eliminar"
          onConfirm={async () => {
            await removeFriend(friendToRemove.id)
            toast.success(`${friendToRemove.name} ya no está en tus amigos`)
            await load()
          }}
        />
      )}
    </div>
  )
}

function SearchAction({ user, busy, onAction }: { user: UserSearchResult; busy: boolean; onAction: () => void }) {
  switch (user.friendship) {
    case "friends":
      return (
        <span className="flex items-center gap-1 text-xs font-semibold text-success">
          <Check className="size-3.5" /> Amigos
        </span>
      )
    case "outgoing":
      return (
        <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <Clock className="size-3.5" /> Enviada
        </span>
      )
    case "incoming":
      return (
        <Button size="sm" onClick={onAction} disabled={busy} aria-label={`Aceptar a ${user.name}`}>
          {busy ? <Loader2 className="animate-spin" /> : <Check />}
          Aceptar
        </Button>
      )
    default:
      return (
        <Button size="sm" variant="secondary" onClick={onAction} disabled={busy} aria-label={`Agregar amigo ${user.name}`}>
          {busy ? <Loader2 className="animate-spin" /> : <UserPlus />}
          Agregar
        </Button>
      )
  }
}
