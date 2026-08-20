import { Moon, Sun } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useSettingsStore, type ThemeMode } from "@/store/settingsStore"
import type { CurrencyCode } from "@/lib/utils"

export function SettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const currency = useSettingsStore((s) => s.currency)
  const setCurrency = useSettingsStore((s) => s.setCurrency)
  const theme = useSettingsStore((s) => s.theme)
  const setTheme = useSettingsStore((s) => s.setTheme)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajustes</DialogTitle>
          <DialogDescription>Preferencias de la aplicación.</DialogDescription>
        </DialogHeader>

        <div className="mt-4 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label>Moneda</Label>
            <ToggleGroup
              type="single"
              value={currency}
              onValueChange={(value) => value && setCurrency(value as CurrencyCode)}
            >
              <ToggleGroupItem value="USD">USD — Dólar</ToggleGroupItem>
              <ToggleGroupItem value="GTQ">GTQ — Quetzal</ToggleGroupItem>
            </ToggleGroup>
            <p className="text-xs text-muted-foreground">
              Cambia el código mostrado en los montos. La conversión de tasas llega después.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Apariencia</Label>
            <ToggleGroup
              type="single"
              value={theme}
              onValueChange={(value) => value && setTheme(value as ThemeMode)}
            >
              <ToggleGroupItem value="light">
                <Sun className="size-4" /> Claro
              </ToggleGroupItem>
              <ToggleGroupItem value="dark">
                <Moon className="size-4" /> Oscuro
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
