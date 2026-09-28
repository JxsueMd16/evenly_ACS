import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import { AppShell } from "./AppShell"

export function ProtectedRoute() {
  const user = useAuthStore((s) => (s.token ? s.user : null))
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
