import { create } from "zustand"
import { persist } from "zustand/middleware"
import { formatCurrency, type CurrencyCode } from "@/lib/utils"

export type ThemeMode = "light" | "dark"

interface SettingsState {
  currency: CurrencyCode
  theme: ThemeMode
  setCurrency: (currency: CurrencyCode) => void
  setTheme: (theme: ThemeMode) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      currency: "USD",
      theme: "light",
      setCurrency(currency) {
        set({ currency })
      },
      setTheme(theme) {
        set({ theme })
      },
    }),
    { name: "evenly-settings" },
  ),
)

/** Bind the active currency once per component instead of threading it through every call site. */
export function useFormatCurrency() {
  const currency = useSettingsStore((s) => s.currency)
  return (amount: number) => formatCurrency(amount, currency)
}
