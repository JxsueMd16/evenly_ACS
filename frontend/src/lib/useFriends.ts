import { useEffect, useState } from "react"
import { getFriends } from "./api"
import type { User } from "./types"

/**
 * Lista de amigos aceptados del usuario, para elegirlos rápido al armar un
 * grupo. Se carga cuando `enabled` pasa a true (por ejemplo, al abrir un
 * diálogo). Si falla, queda vacía: la búsqueda general sigue disponible.
 */
export function useFriends(enabled: boolean) {
  const [friends, setFriends] = useState<User[]>([])

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    getFriends()
      .then((data) => !cancelled && setFriends(data.friends))
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [enabled])

  return friends
}
