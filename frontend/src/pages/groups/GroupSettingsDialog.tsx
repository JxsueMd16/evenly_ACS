import { useState, type FormEvent } from "react"
import { Loader2, LogOut, Trash2, UserMinus, UserPlus } from "lucide-react"
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
import { UserAvatar } from "@/components/UserAvatar"
import { CategoryPicker } from "@/components/CategoryPicker"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { UserSearchField } from "@/components/UserSearchField"
import { addMember, deleteGroup, getGroup, removeMember, updateGroup } from "@/lib/api"
import { useUserSearch } from "@/lib/useUserSearch"
import { useFriends } from "@/lib/useFriends"
import type { CategoryId } from "@/lib/categories"
import type { GroupDetail, GroupMember, User } from "@/lib/types"

type PendingAction = { kind: "remove"; member: GroupMember } | { kind: "delete" } | { kind: "leave" }

/**
 * Ajustes del grupo. El administrador edita nombre y categoría, agrega o
 * quita integrantes y elimina el grupo; un integrante puede salir del grupo.
 * Los permisos se validan otra vez en el backend: aquí solo se ocultan las
 * acciones que no le corresponden al usuario.
 */
export function GroupSettingsDialog({
  group,
  currentUserId,
  open,
  onOpenChange,
  onGroupChanged,
  onGroupLeft,
}: {
  group: GroupDetail
  currentUserId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onGroupChanged: (group: GroupDetail) => void
  /** El grupo se eliminó o el usuario salió: la pantalla debe salir del detalle. */
  onGroupLeft: (message: string) => void
}) {
  const isAdmin = group.members.some((m) => m.id === currentUserId && m.role === "ADMIN")

  const [name, setName] = useState(group.name)
  const [category, setCategory] = useState<CategoryId>(group.category)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [query, setQuery] = useState("")
  const [addingId, setAddingId] = useState<string | null>(null)
  const search = useUserSearch(query)
  const friends = useFriends(open && isAdmin)
  // Sin búsqueda se sugieren los amigos que todavía no están en el grupo.
  const candidates: User[] = (search.canSearch ? search.results : friends).filter(
    (u) => !group.memberIds.includes(u.id),
  )

  const [pending, setPending] = useState<PendingAction | null>(null)

  const hasChanges = name.trim() !== group.name || category !== group.category

  function handleOpenChange(next: boolean) {
    if (next) {
      // Al reabrir, el formulario parte de los datos actuales del grupo.
      setName(group.name)
      setCategory(group.category)
      setFormError(null)
      setQuery("")
    }
    onOpenChange(next)
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!name.trim()) return setFormError("Ponle un nombre al grupo.")
    setIsSaving(true)
    try {
      const updated = await updateGroup(group.id, {
        ...(name.trim() !== group.name && { name: name.trim() }),
        ...(category !== group.category && { category }),
      })
      onGroupChanged(updated)
      toast.success("Grupo actualizado")
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "No se pudo actualizar el grupo.")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleAdd(user: User) {
    setAddingId(user.id)
    try {
      const updated = await addMember(group.id, user.id)
      onGroupChanged(updated)
      setQuery("")
      toast.success(`${user.name} se unió al grupo`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo agregar al integrante.")
    } finally {
      setAddingId(null)
    }
  }

  async function runPending() {
    if (!pending) return
    if (pending.kind === "remove") {
      await removeMember(group.id, pending.member.id)
      const refreshed = await getGroup(group.id)
      if (refreshed) onGroupChanged(refreshed)
      toast.success(`${pending.member.name} ya no es parte del grupo`)
    } else if (pending.kind === "leave") {
      await removeMember(group.id, currentUserId)
      onGroupLeft("Saliste del grupo")
    } else {
      await deleteGroup(group.id)
      onGroupLeft("Grupo eliminado")
    }
  }

  const confirmCopy: Record<PendingAction["kind"], { title: string; description: string; confirmLabel: string }> = {
    remove: {
      title: "Quitar integrante",
      description: `¿Quitar a ${pending?.kind === "remove" ? pending.member.name : ""} del grupo? Solo es posible si no participa en ningún gasto.`,
      confirmLabel: "Quitar",
    },
    leave: {
      title: "Salir del grupo",
      description: "Dejarás de ver este grupo y sus gastos. Solo es posible si no participas en ningún gasto.",
      confirmLabel: "Salir",
    },
    delete: {
      title: "Eliminar grupo",
      description: `Se eliminará "${group.name}" junto con todos sus gastos. Esta acción no se puede deshacer.`,
      confirmLabel: "Eliminar grupo",
    },
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajustes del grupo</DialogTitle>
          <DialogDescription>
            {isAdmin ? "Eres el administrador de este grupo." : "Solo el administrador puede editar el grupo."}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 flex flex-col gap-6">
          {isAdmin && (
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="settings-group-name">Nombre</Label>
                <Input
                  id="settings-group-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={60}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Categoría</Label>
                <CategoryPicker value={category} onChange={setCategory} />
              </div>
              {formError && <p className="text-xs text-destructive">{formError}</p>}
              <Button type="submit" disabled={!hasChanges || isSaving}>
                {isSaving && <Loader2 className="animate-spin" />}
                Guardar cambios
              </Button>
            </form>
          )}

          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-foreground">Integrantes ({group.members.length})</h3>
            <div className="flex flex-col divide-y divide-border rounded-3xl border border-border">
              {group.members.map((member) => (
                <div key={member.id} className="flex items-center gap-3 p-3">
                  <UserAvatar user={member} className="size-9" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {member.id === currentUserId ? "Tú" : member.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">{member.email}</span>
                  </span>
                  {member.role === "ADMIN" && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      Admin
                    </span>
                  )}
                  {isAdmin && member.id !== currentUserId && (
                    <button
                      type="button"
                      onClick={() => setPending({ kind: "remove", member })}
                      aria-label={`Quitar a ${member.name}`}
                      className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <UserMinus className="size-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {isAdmin && (
            <section className="flex flex-col gap-2">
              <Label htmlFor="add-member-search">Agregar integrante</Label>
              {!search.canSearch && candidates.length > 0 && (
                <p className="text-xs text-muted-foreground">Tus amigos que aún no están en el grupo:</p>
              )}
              <UserSearchField
                id="add-member-search"
                value={query}
                onChange={setQuery}
                isSearching={search.isSearching}
                noResults={search.canSearch && !search.isSearching && candidates.length === 0}
              />
              {search.error && <p className="text-xs text-destructive">{search.error}</p>}
              <div className="flex flex-col gap-2">
                {candidates.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 rounded-2xl border border-border p-2.5">
                    <UserAvatar user={user} className="size-9" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">{user.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => handleAdd(user)}
                      disabled={addingId !== null}
                      aria-label={`Agregar a ${user.name}`}
                    >
                      {addingId === user.id ? <Loader2 className="animate-spin" /> : <UserPlus />}
                      Agregar
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="border-t border-border pt-4">
            {isAdmin ? (
              <Button
                type="button"
                variant="outline"
                className="w-full text-destructive"
                onClick={() => setPending({ kind: "delete" })}
              >
                <Trash2 /> Eliminar grupo
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full text-destructive"
                onClick={() => setPending({ kind: "leave" })}
              >
                <LogOut /> Salir del grupo
              </Button>
            )}
          </div>
        </div>

        {pending && (
          <ConfirmDialog
            open
            onOpenChange={(next) => !next && setPending(null)}
            {...confirmCopy[pending.kind]}
            onConfirm={runPending}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
