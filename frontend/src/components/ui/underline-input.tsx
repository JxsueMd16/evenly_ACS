import * as React from "react"
import { cn } from "@/lib/utils"

function UnderlineInput({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="underline-input"
      className={cn(
        "h-11 w-full border-0 border-b-2 border-border bg-transparent px-0 text-base text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors",
        "focus-visible:border-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  )
}

export { UnderlineInput }
