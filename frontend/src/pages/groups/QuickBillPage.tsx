import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, Check, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/UserAvatar"
import { UserSearchField } from "@/components/UserSearchField"
import { BillForm } from "@/components/bill/BillForm"
import { createQuickBill } from "@/lib/api"
import { useFriends } from "@/lib/useFriends"
import { useUserSearch } from "@/lib/useUserSearch"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/authStore"
import type { User } from "@/lib/types"

/**
 * Cuenta rápida, sin armar un grupo antes: 1) con quién, 2) la cuenta.
 * El backend crea un grupo "rápido" para guardarla.
 */
export function QuickBillPage() {
  const currentUser = useAuthStore((s) => s.user)!
  const navigate = useNavigate()
  const [step, setStep] = useState<"people" | "bill">("people")
  const [people, setPeople] = useState<User[]>([])
  const [query, setQuery] = useState("")
  const friends = useFriends(true)
  const search = useUserSearch(query)

  const suggestions = (search.canSearch ? search.results : friends).filter((u) => u.id !== currentUser.id)

  function toggle(user: User) {
    setPeople((prev) => (prev.some((p) => p.id === user.id) ? prev.filter((p) => p.id !== user.id) : [...prev, user]))
  }

  return (
    <div className="flex flex-col gap-5 pb-8">
      <header className="flex items-center gap-3 bg-sky/50 px-5 pb-6 pt-6">
        {step === "people" ? (
          <Link
            to="/add-expense"
            aria-label="Volver"
            className="flex size-9 items-center justify-center rounded-2xl bg-card text-foreground shadow-sm"
          >
            <ArrowLeft className="size-4" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => setStep("people")}
            aria-label="Volver a elegir personas"
            className="flex size-9 items-center justify-center rounded-2xl bg-card text-foreground shadow-sm"
          >
            <ArrowLeft className="size-4" />
          </button>
        )}
        <div>
          <h1 className="text-lg font-bold text-foreground">Cuenta rápida</h1>
          <p className="text-xs text-muted-foreground">
            {step === "people" ? "Paso 1 de 2 · ¿Con quién dividiste?" : "Paso 2 de 2 · Detalle de la cuenta"}
          </p>
        </div>
      </header>

      {step === "people" ? (
        <div className="flex flex-col gap-4 px-5">
          {people.length > 0 && (
            <div className="flex flex-wrap gap-2" aria-label="Personas elegidas">
              {people.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggle(p)}
                  aria-label={`Quitar a ${p.name}`}
                  className="flex items-center gap-1.5 rounded-full border border-primary bg-primary/10 py-1 pl-1 pr-2 text-sm"
                >
                  <UserAvatar user={p} className="size-6" />
                  {p.name.split(" ")[0]}
                  <X className="size-3.5 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="quick-search" className="text-sm font-semibold text-foreground">
              Agrega a las personas
            </label>
            <UserSearchField
              id="quick-search"
              value={query}
              onChange={setQuery}
              isSearching={search.isSearching}
              noResults={search.canSearch && !search.isSearching && search.results.length === 0}
            />
            {!search.canSearch && friends.length > 0 && <p className="text-xs text-muted-foreground">Tus amigos:</p>}
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
            {!search.canSearch && friends.length === 0 && (
              <p className="text-xs text-muted-foreground">Busca a las personas por nombre o correo.</p>
            )}
          </div>

          <Button size="lg" disabled={people.length === 0} onClick={() => setStep("bill")}>
            Continuar con {people.length === 0 ? "…" : people.length === 1 ? "1 persona" : `${people.length} personas`}
          </Button>
        </div>
      ) : (
        <BillForm
          members={[currentUser, ...people]}
          currentUserId={currentUser.id}
          onSubmit={async (bill) => {
            const { groupId } = await createQuickBill(
              people.map((p) => p.id),
              bill,
            )
            toast.success("Cuenta rápida guardada")
            navigate(`/groups/${groupId}`, { replace: true })
          }}
        />
      )}
    </div>
  )
}
