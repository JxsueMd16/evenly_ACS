import { CategoryIcon } from "@/components/CategoryIcon"
import { CATEGORIES, type CategoryId } from "@/lib/categories"
import { cn } from "@/lib/utils"

export function CategoryPicker({ value, onChange }: { value: CategoryId; onChange: (id: CategoryId) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          aria-pressed={value === option.id}
          className={cn(
            "flex flex-col items-center gap-1 rounded-2xl p-1.5 transition-colors",
            value === option.id && "ring-2 ring-primary",
          )}
        >
          <CategoryIcon category={option.id} className="size-10" />
          <span className="text-[10px] text-muted-foreground">{option.label}</span>
        </button>
      ))}
    </div>
  )
}
