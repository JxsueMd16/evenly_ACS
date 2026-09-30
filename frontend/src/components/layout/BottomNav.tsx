import { NavLink } from "react-router-dom"
import { Home, Users, Plus, UserRound, UsersRound } from "lucide-react"
import { cn } from "@/lib/utils"
import { useNotificationsStore } from "@/store/notificationsStore"

type BadgeKey = "groups" | "friends"

const NAV_ITEMS: {
  to: string
  label: string
  icon: typeof Home
  end?: boolean
  isCenter?: boolean
  badge?: BadgeKey
}[] = [
  { to: "/", label: "Inicio", icon: Home, end: true },
  { to: "/groups", label: "Grupos", icon: Users, badge: "groups" },
  { to: "/add-expense", label: "Agregar", icon: Plus, isCenter: true },
  { to: "/friends", label: "Amigos", icon: UsersRound, badge: "friends" },
  { to: "/profile", label: "Perfil", icon: UserRound },
]

export function BottomNav() {
  const friendRequests = useNotificationsStore((s) => s.friendRequests)
  const groupsWithDebt = useNotificationsStore((s) => s.groupsWithDebt)
  const paymentsToConfirm = useNotificationsStore((s) => s.paymentsToConfirm)
  const groupActions = groupsWithDebt + paymentsToConfirm
  const connected = useNotificationsStore((s) => s.connected)

  const badges: Record<BadgeKey, { count: number; label: string; tone: string }> = {
    friends: {
      count: friendRequests,
      label: friendRequests === 1 ? "1 solicitud de amistad" : `${friendRequests} solicitudes de amistad`,
      tone: "bg-primary text-primary-foreground",
    },
    groups: {
      count: groupActions,
      label: [
        groupsWithDebt > 0 && (groupsWithDebt === 1 ? "debes en 1 grupo" : `debes en ${groupsWithDebt} grupos`),
        paymentsToConfirm > 0 &&
          (paymentsToConfirm === 1 ? "1 pago por confirmar" : `${paymentsToConfirm} pagos por confirmar`),
      ]
        .filter(Boolean)
        .join(" y "),
      tone: "bg-destructive text-destructive-foreground",
    },
  }

  return (
    <nav data-realtime={connected} className="relative z-40 shrink-0 border-t border-border bg-card/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
      <ul className="flex items-center justify-between">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end, isCenter, badge }) => {
          const info = badge ? badges[badge] : null
          const showBadge = info !== null && info.count > 0
          return (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end={end}
                aria-label={showBadge ? `${label}: ${info.label}` : label}
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
                      <span className="relative">
                        <Icon className="size-5" />
                        {showBadge && (
                          <span
                            data-testid={`badge-${badge}`}
                            className={cn(
                              "absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none ring-2 ring-card",
                              info.tone,
                            )}
                          >
                            {info.count > 9 ? "9+" : info.count}
                          </span>
                        )}
                      </span>
                      <span>{label}</span>
                    </>
                  )
                }
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
