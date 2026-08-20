import type { ReactNode } from "react"
import { BottomNav } from "./BottomNav"

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <div className="flex-1 overflow-y-auto pb-24">{children}</div>
      <BottomNav />
    </div>
  )
}
