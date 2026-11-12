import { create } from "zustand"
import { persist } from "zustand/middleware"
import { formatCurrency, type CurrencyCode } from "@/lib/utils"

export type ThemeMode = "light" | "dark"

interface SettingsState {
  currency: CurrencyCode
  theme: ThemeMode
  /** Mostrar la bienvenida (UX-10): al crear la cuenta o desde Perfil → Ayuda. */
  welcomeOpen: boolean
  setCurrency: (currency: CurrencyCode) => void
  setTheme: (theme: ThemeMode) => void
  setWelcomeOpen: (open: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      currency: "GTQ",
      theme: "light",
      welcomeOpen: false,
      setCurrency(currency) {
        set({ currency })
      },
      setTheme(theme) {
        set({ theme })
      },
      setWelcomeOpen(welcomeOpen) {
        set({ welcomeOpen })
      },
    }),
    {
      name: "evenly-settings",
      // v1: la moneda por defecto pasó de USD a quetzales (UX-01). Antes no se podía
      // distinguir "eligió USD" de "nunca abrió Ajustes", así que se migra a GTQ.
      version: 1,
      migrate: (persisted, version) => {
        const state = persisted as Partial<SettingsState>
        return version < 1 ? { ...state, currency: "GTQ" } : state
      },
    },
  ),
)

/** Bind the active currency once per component instead of threading it through every call site. */
export function useFormatCurrency() {
  const currency = useSettingsStore((s) => s.currency)
  return (amount: number) => formatCurrency(amount, currency)
}
