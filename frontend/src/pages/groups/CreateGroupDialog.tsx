import { useState, type FormEvent } from "react"
import { Check, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserAvatar } from "@/components/UserAvatar"
import { UserSearchField } from "@/components/UserSearchField"
import { cn } from "@/lib/utils"
import { createGroup } from "@/lib/api"
import { useUserSearch } from "@/lib/useUserSearch"
import { useFriends } from "@/lib/useFriends"
import type { User } from "@/lib/types"

export function CreateGroupDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Recibe el id del grupo creado (la pantalla navega a él). */
  onCreated: (groupId: string) => void
}) {
  const [name, setName] = useState("")
  const [selected, setSelected] = useState<User[]>([])
  const [query, setQuery] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const search = useUserSearch(query)
  const friends = useFriends(open)

  function toggleMember(member: User) {
    setSelected((prev) =>
      prev.some((m) => m.id === member.id) ? prev.filter((m) => m.id !== member.id) : [...prev, member],
    )
  }

  // Seleccionados primero; después, si hay búsqueda, sus resultados, y si no, tus amigos.
  const suggestions: User[] = search.canSearch ? search.results : friends
  const options = [...selected, ...suggestions.filter((r) => !selected.some((m) => m.id === r.id))]

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError("Ponle un nombre al grupo.")
      return
    }
    setIsSubmitting(true)
    try {
      const group = await createGroup(name, "grupo", selected.map((m) => m.id))
      setName("")
      setSelected([])
      setQuery("")
      onOpenChange(false)
      onCreated(group.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el grupo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo grupo</DialogTitle>
          <DialogDescription>
            Un grupo reúne a las mismas personas para varias cuentas (almuerzos, transporte, servicios…).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="group-name">Nombre</Label>
            <Input
              id="group-name"
              placeholder="Ej. Universidad, Depa, Viaje a Antigua"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="member-search">Integrantes</Label>
            <p className="text-xs text-muted-foreground">
              {friends.length > 0 && !search.canSearch
                ? "Elige entre tus amigos o busca a cualquier persona por nombre o correo."
                : "Busca por nombre o correo. También podrás invitar con un enlace después de crear el grupo."}
            </p>
            <UserSearchField
              id="member-search"
              value={query}
              onChange={setQuery}
              isSearching={search.isSearching}
              noResults={search.canSearch && !search.isSearching && search.results.length === 0}
            />
            <div className="flex max-h-56 flex-col gap-2 overflow-y-auto">
              {options.map((member) => {
                const checked = selected.some((m) => m.id === member.id)
                return (
                  <button
                    type="button"
                    key={member.id}
                    onClick={() => toggleMember(member)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border border-border p-2.5 text-left transition-colors",
                      checked && "border-primary bg-primary/5",
                    )}
                  >
                    <UserAvatar user={member} className="size-9" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">{member.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{member.email}</span>
                    </span>
                    <span
                      className={cn(
                        "flex size-5 items-center justify-center rounded-full border-2 border-border text-primary-foreground",
                        checked && "border-primary bg-primary",
                      )}
                    >
                      {checked && <Check className="size-3" strokeWidth={3} />}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {(error ?? search.error) && <p className="text-xs text-destructive">{error ?? search.error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="animate-spin" />}
              Crear grupo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
