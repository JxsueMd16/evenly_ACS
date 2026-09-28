import { Loader2, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

/** Campo de búsqueda de usuarios; los resultados los muestra quien lo usa (ver useUserSearch). */
export function UserSearchField({
  id,
  value,
  onChange,
  isSearching,
  noResults,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  isSearching: boolean
  noResults: boolean
}) {
  return (
    <>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          placeholder="Busca por nombre o correo"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-9"
          maxLength={50}
          autoComplete="off"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>
      {noResults && <p className="text-xs text-muted-foreground">No encontramos usuarios con ese nombre o correo.</p>}
    </>
  )
}
