import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// Our theme (index.css) defines custom color tokens (primary, ice, sky, pink,
// card, border, …) that tailwind-merge doesn't know about out of the box —
// without this it treats e.g. `bg-card` and `bg-pink` as unrelated classes
// and keeps both, so the "winning" background becomes a coin flip based on
// generated CSS order instead of the last class in the list. Registering
// them under the `color` theme scale fixes conflict resolution for every
// bg-*/text-*/border-*/ring-* pairing across the app, not just one call site.
const CUSTOM_COLORS = [
  "background",
  "foreground",
  "muted",
  "muted-foreground",
  "ice",
  "ice-foreground",
  "sky",
  "sky-foreground",
  "pink",
  "pink-foreground",
  "primary",
  "primary-hover",
  "primary-foreground",
  "accent-sky",
  "accent-sky-hover",
  "accent-sky-foreground",
  "card",
  "card-foreground",
  "border",
  "input",
  "ring",
  "destructive",
  "destructive-foreground",
  "success",
  "success-foreground",
  "warning",
]

const twMerge = extendTailwindMerge({
  extend: { theme: { color: CUSTOM_COLORS } },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type CurrencyCode = "USD" | "GTQ"

export function formatCurrency(amount: number, currency: CurrencyCode = "USD") {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    currencyDisplay: "code",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}
