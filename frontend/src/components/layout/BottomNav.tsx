import { NavLink } from "react-router-dom"
import { Home, Users, Plus, Activity, User } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/groups", label: "Grupos", icon: Users },
  { to: "/add-expense", label: "Agregar", icon: Plus, isCenter: true },
  { to: "/activity", label: "Actividad", icon: Activity },
  { to: "/profile", label: "Perfil", icon: User },
]

export function BottomNav() {
  return (
    <nav className="absolute inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
      <ul className="flex items-center justify-between">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end, isCenter }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 rounded-2xl py-1.5 text-[11px] font-medium text-sky-foreground/60 transition-colors",
                  isActive && !isCenter && "text-primary",
                )
              }
            >
              {({ isActive }) =>
                isCenter ? (
                  <>
                    <span className="-mt-6 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                      <Icon className="size-6" />
                    </span>
                    <span className={cn(isActive && "text-primary")}>{label}</span>
                  </>
                ) : (
                  <>
                    <Icon className="size-5" />
                    <span>{label}</span>
                  </>
                )
              }
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
