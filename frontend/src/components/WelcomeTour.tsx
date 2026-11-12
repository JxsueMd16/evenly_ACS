import { useState } from "react"
import { BellRing, HandCoins, Plus, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useSettingsStore } from "@/store/settingsStore"

const STEPS = [
  {
    icon: Users,
    title: "Dividan sin enredos",
    text: "Evenly lleva la cuenta de lo que se deben entre compañeros: almuerzos, taxis o lo que compartan.",
  },
  {
    icon: Plus,
    title: "Agrega un gasto en segundos",
    text: "Toca +, elige con quién fue, escribe cuánto pagaste y listo. Se divide en partes iguales; si quieres, por ítems o con propina.",
  },
  {
    icon: HandCoins,
    title: "Paga y confirma",
    text: "En Inicio ves a quién le debes. Toca Pagar, y cuando la otra persona confirme que lo recibió, la deuda queda saldada.",
  },
  {
    icon: BellRing,
    title: "¿Te deben? Recuérdales",
    text: "Con Recordar le llega un aviso a quien te debe. Puedes volver a ver esta guía en Perfil → Cómo funciona Evenly.",
  },
] as const

/** Bienvenida de la primera vez (UX-10). Se puede saltar en cualquier momento. */
export function WelcomeTour() {
  const open = useSettingsStore((s) => s.welcomeOpen)
  const close = () => useSettingsStore.getState().setWelcomeOpen(false)
  const [step, setStep] = useState(0)

  if (!open) return null
  const current = STEPS[step]!
  const Icon = current.icon
  const isLast = step === STEPS.length - 1

  function finish() {
    setStep(0)
    close()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
    >
      <div className="flex w-full max-w-sm flex-col gap-5 rounded-3xl bg-card p-6 shadow-xl">
        <div className="flex justify-end">
          <button type="button" onClick={finish} className="py-1 text-sm font-medium text-muted-foreground">
            Saltar
          </button>
        </div>
        <span className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
          <Icon className="size-8" />
        </span>
        <div className="flex flex-col gap-2 text-center">
          <h2 id="welcome-title" className="text-lg font-bold text-foreground">
            {current.title}
          </h2>
          <p className="text-sm text-muted-foreground">{current.text}</p>
        </div>
        <div className="flex justify-center gap-1.5" aria-label={`Paso ${step + 1} de ${STEPS.length}`}>
          {STEPS.map((_, i) => (
            <span key={i} className={cn("h-1.5 rounded-full transition-all", i === step ? "w-6 bg-primary" : "w-1.5 bg-border")} />
          ))}
        </div>
        <div className="flex gap-2">
          {step > 0 && (
            <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep(step - 1)}>
              Atrás
            </Button>
          )}
          <Button size="lg" className="flex-1" onClick={isLast ? finish : () => setStep(step + 1)}>
            {isLast ? "Empezar" : "Siguiente"}
          </Button>
        </div>
      </div>
    </div>
  )
}
