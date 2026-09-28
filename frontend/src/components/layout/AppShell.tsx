import { useEffect, useRef, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { connectNotifications } from "@/lib/notificationStream"
import { useAuthStore } from "@/store/authStore"
import { useNotificationsStore } from "@/store/notificationsStore"
import { BottomNav } from "./BottomNav"

/**
 * Mantiene abierta la conexión de notificaciones en tiempo real mientras hay
 * sesión: actualiza los contadores de la barra y muestra cada aviso como toast.
 */
function useRealtimeNotifications() {
  const token = useAuthStore((s) => s.token)
  const navigate = useNavigate()
  // En un ref para que la conexión dependa solo del token y no se reabra al navegar.
  const navigateRef = useRef(navigate)
  useEffect(() => {
    navigateRef.current = navigate
  }, [navigate])

  useEffect(() => {
    if (!token) return
    const { setCounts, pushNotice, setConnected, reset } = useNotificationsStore.getState()
    const disconnect = connectNotifications(token, {
      onCounts: setCounts,
      onNotice: (notice) => {
        pushNotice(notice)
        toast(notice.message, notice.link ? { action: { label: "Ver", onClick: () => navigateRef.current(notice.link!) } } : {})
      },
      onUnauthorized: () => useAuthStore.getState().logout(),
      onConnectionChange: setConnected,
    })
    return () => {
      disconnect()
      reset()
    }
  }, [token])
}

export function AppShell({ children }: { children: ReactNode }) {
  useRealtimeNotifications()
  return (
    <div className="app-shell">
      <div className="flex-1 overflow-y-auto pb-24">{children}</div>
      <BottomNav />
    </div>
  )
}
