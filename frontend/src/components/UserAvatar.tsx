import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn, initials } from "@/lib/utils"
import type { User } from "@/lib/types"

const THEME_CLASSES: Record<User["avatarColor"], string> = {
  ice: "bg-ice text-ice-foreground",
  sky: "bg-sky text-sky-foreground",
  pink: "bg-pink text-pink-foreground",
}

export function UserAvatar({ user, className }: { user: User; className?: string }) {
  return (
    <Avatar className={className}>
      <AvatarFallback className={cn(THEME_CLASSES[user.avatarColor])}>
        {initials(user.name)}
      </AvatarFallback>
    </Avatar>
  )
}
