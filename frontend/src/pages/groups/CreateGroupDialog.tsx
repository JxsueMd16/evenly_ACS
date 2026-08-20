import { useState, type FormEvent } from "react"
import { Check, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserAvatar } from "@/components/UserAvatar"
import { CategoryIcon } from "@/components/CategoryIcon"
import { cn } from "@/lib/utils"
import { createGroup, getAllUsers } from "@/lib/mockApi"
import { CATEGORIES, type CategoryId } from "@/lib/categories"
import { useAuthStore } from "@/store/authStore"

export function CreateGroupDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}) {
  const user = useAuthStore((s) => s.user)!
  const others = getAllUsers().filter((u) => u.id !== user.id)

  const [name, setName] = useState("")
  const [category, setCategory] = useState<CategoryId>(CATEGORIES[0].id)
  const [memberIds, setMemberIds] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleMember(id: string) {
    setMemberIds((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError("Ponle un nombre al grupo.")
      return
    }
    setIsSubmitting(true)
    try {
      await createGroup(name, category, [user.id, ...memberIds])
      setName("")
      setCategory(CATEGORIES[0].id)
      setMemberIds([])
      onOpenChange(false)
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el grupo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo grupo</DialogTitle>
          <DialogDescription>Crea un grupo para empezar a compartir gastos.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="group-name">Nombre</Label>
            <Input
              id="group-name"
              placeholder="Ej. Viaje a la montaña"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Categoría</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setCategory(option.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-2xl p-1.5 transition-colors",
                    category === option.id && "ring-2 ring-primary",
                  )}
                >
                  <CategoryIcon category={option.id} className="size-10" />
                  <span className="text-[10px] text-muted-foreground">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Integrantes</Label>
            <div className="flex flex-col gap-2">
              {others.map((member) => {
                const checked = memberIds.includes(member.id)
                return (
                  <button
                    type="button"
                    key={member.id}
                    onClick={() => toggleMember(member.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border border-border p-2.5 text-left transition-colors",
                      checked && "border-primary bg-primary/5",
                    )}
                  >
                    <UserAvatar user={member} className="size-9" />
                    <span className="flex-1 text-sm font-medium text-foreground">{member.name}</span>
                    <span
                      className={cn(
                        "flex size-5 items-center justify-center rounded-full border-2 border-border text-primary-foreground",
                        checked && "border-primary bg-primary",
                      )}
                    >
                      {checked && <Check className="size-3" strokeWidth={3} />}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="animate-spin" />}
              Crear grupo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
