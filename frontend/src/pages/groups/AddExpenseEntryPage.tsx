import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Check, ChevronRight, Loader2, Plus, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CategoryIcon } from "@/components/CategoryIcon"
import { UserAvatar } from "@/components/UserAvatar"
import { UserSearchField } from "@/components/UserSearchField"
import { getGroups } from "@/lib/api"
import { useFriends } from "@/lib/useFriends"
import { useUserSearch } from "@/lib/useUserSearch"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/authStore"
import type { Group, User } from "@/lib/types"

/**
 * Botón "+" (UX-02): una sola pregunta, "¿Con quién fue?".
 * - Un grupo (los más recientes primero) → directo al formulario.
 * - Personas sueltas → se guarda como cuenta rápida por dentro, sin que el
 *   usuario tenga que saber que existe esa diferencia.
 */
export function AddExpenseEntryPage() {
  const currentUser = useAuthStore((s) => s.user)!
  const navigate = useNavigate()
  const [groups, setGroups] = useState<Group[] | null>(null)
  const [people, setPeople] = useState<User[]>([])
  const [query, setQuery] = useState("")
  const friends = useFriends(true)
  const search = useUserSearch(query)

  useEffect(() => {
    getGroups()
      .then((all) =>
        setGroups(
          all
            .filter((g) => !g.isQuick)
            .sort((a, b) => Date.parse(b.lastActivityAt) - Date.parse(a.lastActivityAt)),
        ),
      )
      .catch((err: Error) => {
        setGroups([])
        toast.error(err.message)
      })
  }, [])

  const suggestions = (search.canSearch ? search.results : friends).filter((u) => u.id !== currentUser.id)
  const nothingYet = groups?.length === 0 && friends.length === 0

  function toggle(user: User) {
    setPeople((prev) => (prev.some((p) => p.id === user.id) ? prev.filter((p) => p.id !== user.id) : [...prev, user]))
  }

  return (
    <div className="flex flex-col gap-5 px-5 pb-6 pt-6">
      <header>
        <h1 className="text-xl font-bold text-foreground">¿Con quién fue?</h1>
        <p className="text-sm text-muted-foreground">Elige un grupo o marca a las personas</p>
      </header>

      {nothingYet && (
        <Card className="flex flex-col gap-2 p-4 text-sm text-muted-foreground" data-testid="add-expense-empty">
          <p className="font-medium text-foreground">Todavía no tienes grupos ni amigos en Evenly.</p>
          <p>Busca a tus compañeros por nombre o correo aquí abajo, o crea un grupo si siempre almuerzan juntos.</p>
        </Card>
      )}

      <section className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Tus grupos</h2>
          <Link
            to="/groups"
            state={{ openCreate: true }}
            className="flex items-center gap-1 py-1 text-sm font-medium text-primary"
          >
            <Plus className="size-4" /> Nuevo grupo
          </Link>
        </div>

        {!groups && (
          <div className="flex justify-center py-6 text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
          </div>
        )}

        {groups?.map((group) => (
          <Link key={group.id} to={`/groups/${group.id}/add-expense`} aria-label={`Agregar gasto en ${group.name}`}>
            <Card className="flex items-center gap-4 p-3.5">
              <CategoryIcon category={group.category} className="size-11" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-foreground">{group.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {group.members
                    .filter((m) => m.id !== currentUser.id)
                    .map((m) => m.name.split(" ")[0])
                    .join(", ") || "Solo tú"}
                </p>
              </div>
              <ChevronRight className="size-5 text-muted-foreground" />
            </Card>
          </Link>
        ))}
      </section>

      <section className="flex flex-col gap-2.5">
        <h2 className="text-base font-semibold text-foreground">
          {groups?.length ? "O con personas sueltas" : "Con personas"}
        </h2>

        {people.length > 0 && (
          <div className="flex flex-wrap gap-2" aria-label="Personas elegidas">
            {people.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => toggle(p)}
                aria-label={`Quitar a ${p.name}`}
                className="flex h-9 items-center gap-1.5 rounded-full border border-primary bg-primary/10 pl-1 pr-2 text-sm"
              >
                <UserAvatar user={p} className="size-7" />
                {p.name.split(" ")[0]}
                <X className="size-3.5 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}

        <UserSearchField
          id="quick-search"
          value={query}
          onChange={setQuery}
          isSearching={search.isSearching}
          noResults={search.canSearch && !search.isSearching && search.results.length === 0}
        />

        <div className="flex flex-col gap-2">
          {suggestions.map((user) => {
            const selected = people.some((p) => p.id === user.id)
            return (
              <button
                key={user.id}
                type="button"
                onClick={() => toggle(user)}
                aria-pressed={selected}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border border-border p-2.5 text-left",
                  selected && "border-primary bg-primary/5",
                )}
              >
                <UserAvatar user={user} className="size-9" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">{user.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
                </span>
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full border-2 border-border text-primary-foreground",
                    selected && "border-primary bg-primary",
                  )}
                >
                  {selected && <Check className="size-3" strokeWidth={3} />}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {people.length > 0 && (
        <div className="sticky bottom-0 -mx-5 bg-background/95 px-5 pb-1 pt-3 backdrop-blur">
          <Button size="lg" className="w-full" onClick={() => navigate("/quick-bill", { state: { people } })}>
            Continuar con {people.length === 1 ? people[0]!.name.split(" ")[0] : `${people.length} personas`}
          </Button>
        </div>
      )}
    </div>
  )
}
