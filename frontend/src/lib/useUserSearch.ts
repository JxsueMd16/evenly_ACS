import { useEffect, useState } from "react"
import { searchUsers } from "./api"
import type { UserSearchResult } from "./types"

/**
 * Busca usuarios en el backend 300 ms después de que se deja de escribir.
 * Con menos de 2 caracteres no busca y no devuelve resultados.
 */
export function useUserSearch(query: string) {
  const [results, setResults] = useState<UserSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const term = query.trim()
  const canSearch = term.length >= 2

  useEffect(() => {
    if (!canSearch) return
    let cancelled = false
    const timer = setTimeout(() => {
      setIsSearching(true)
      setError(null)
      searchUsers(term)
        .then((users) => !cancelled && setResults(users))
        .catch((err: Error) => !cancelled && setError(err.message))
        .finally(() => setIsSearching(false))
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [term, canSearch])

  /** Actualiza un resultado localmente (por ejemplo, tras enviar una solicitud de amistad). */
  function patchResult(id: string, patch: Partial<UserSearchResult>) {
    setResults((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)))
  }

  return { results: canSearch ? results : [], isSearching, error, canSearch, patchResult }
}
