import { Car, Clapperboard, UtensilsCrossed, Users, Wallet, type LucideIcon } from "lucide-react"

export type CategoryId = "grupo" | "comida" | "amigos" | "transporte" | "entretenimiento"

export interface Category {
  id: CategoryId
  label: string
  icon: LucideIcon
  theme: "ice" | "sky" | "pink"
}

export const CATEGORIES: Category[] = [
  { id: "grupo", label: "General", icon: Wallet, theme: "ice" },
  { id: "comida", label: "Comida", icon: UtensilsCrossed, theme: "pink" },
  { id: "amigos", label: "Salidas", icon: Users, theme: "sky" },
  { id: "transporte", label: "Transporte", icon: Car, theme: "ice" },
  { id: "entretenimiento", label: "Entretenimiento", icon: Clapperboard, theme: "pink" },
]

export function getCategory(id: CategoryId): Category {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0]
}
