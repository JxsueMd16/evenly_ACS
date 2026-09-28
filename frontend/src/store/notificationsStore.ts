import { create } from "zustand"
import type { NotificationCounts } from "@/lib/api"
import type { Notice } from "@/lib/notificationStream"

/**
 * Avisos en tiempo real (solicitudes de amistad, grupos con pagos pendientes).
 * Los valores llegan por Server-Sent Events desde el backend (ver
 * lib/notificationStream.ts y AppShell); las pantallas solo los leen.
 */
interface NotificationsState extends NotificationCounts {
  /** Último aviso recibido; `at` cambia en cada uno para poder reaccionar aunque el texto se repita. */
  lastNotice: (Notice & { at: number }) | null
  /** Si la conexión en tiempo real está abierta. */
  connected: boolean
  setConnected: (connected: boolean) => void
  setCounts: (counts: NotificationCounts) => void
  pushNotice: (notice: Notice) => void
  reset: () => void
}

const EMPTY: NotificationCounts = { friendRequests: 0, groupsWithDebt: 0, totalDebt: 0, paymentsToConfirm: 0 }

export const useNotificationsStore = create<NotificationsState>()((set) => ({
  ...EMPTY,
  lastNotice: null,
  connected: false,
  setConnected: (connected) => set({ connected }),
  setCounts: (counts) => set(counts),
  pushNotice: (notice) => set({ lastNotice: { ...notice, at: Date.now() } }),
  reset: () => set({ ...EMPTY, lastNotice: null, connected: false }),
}))
