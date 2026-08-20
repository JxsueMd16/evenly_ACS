import { cn } from "@/lib/utils"
import { getCategory, type CategoryId } from "@/lib/categories"

const THEME_CLASSES: Record<"ice" | "sky" | "pink", string> = {
  ice: "bg-ice text-ice-foreground",
  sky: "bg-sky text-sky-foreground",
  pink: "bg-pink text-pink-foreground",
}

export function CategoryIcon({
  category,
  className,
  iconClassName,
}: {
  category: CategoryId
  className?: string
  iconClassName?: string
}) {
  const { icon: Icon, theme } = getCategory(category)
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-2xl",
        THEME_CLASSES[theme],
        className,
      )}
    >
      <Icon className={cn("size-5", iconClassName)} strokeWidth={1.75} />
    </span>
  )
}
