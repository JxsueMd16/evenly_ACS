import { Check, Circle } from "lucide-react"
import { PASSWORD_RULES } from "@/lib/password"
import { cn } from "@/lib/utils"

/** Lista de requisitos que se marcan mientras el usuario escribe su contraseña. */
export function PasswordChecklist({ password }: { password: string }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1" aria-label="Requisitos de la contraseña">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(password)
        return (
          <li
            key={rule.id}
            data-ok={ok}
            className={cn("flex items-center gap-1.5 text-xs", ok ? "text-success" : "text-muted-foreground")}
          >
            {ok ? <Check className="size-3.5" strokeWidth={3} /> : <Circle className="size-3" />}
            {rule.label}
          </li>
        )
      })}
    </ul>
  )
}
