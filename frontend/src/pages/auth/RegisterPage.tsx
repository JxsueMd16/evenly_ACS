import { useState, type FormEvent } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { AuthLayout } from "./AuthLayout"
import { Button } from "@/components/ui/button"
import { UnderlineInput } from "@/components/ui/underline-input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/PasswordInput"
import { PasswordChecklist } from "@/components/PasswordChecklist"
import { isStrongPassword } from "@/lib/password"
import { useAuthStore } from "@/store/authStore"

export function RegisterPage() {
  const register = useAuthStore((s) => s.register)
  const isLoading = useAuthStore((s) => s.isLoading)
  const navigate = useNavigate()
  const location = useLocation()
  // Si llegó desde un enlace (por ejemplo una invitación a un grupo), vuelve ahí.
  const from = (location.state as { from?: string } | null)?.from ?? "/"

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string
    email?: string
    password?: string
    confirm?: string
  }>({})

  function validate() {
    const errors: typeof fieldErrors = {}
    if (name.trim().length < 2) errors.name = "Ingresa tu nombre completo."
    if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = "Ingresa un correo válido."
    // Misma política que el backend (backend/src/lib/schemas.ts).
    if (!isStrongPassword(password)) errors.password = "La contraseña no cumple todos los requisitos."
    if (confirm !== password) errors.confirm = "Las contraseñas no coinciden."
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    try {
      await register(name, email, password)
      toast.success(`¡Bienvenido a Evenly, ${name.split(" ")[0]}!`)
      navigate(from, { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo crear la cuenta.")
    }
  }

  return (
    <AuthLayout
      heading="Crea tu cuenta"
      subtitle="Empieza a compartir gastos sin fricción"
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" state={location.state} className="font-semibold text-primary">
            Inicia sesión
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Nombre</Label>
          <UnderlineInput
            id="name"
            placeholder="Tu nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={Boolean(fieldErrors.name)}
            autoComplete="name"
          />
          {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Correo</Label>
          <UnderlineInput
            id="email"
            type="email"
            placeholder="tu@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(fieldErrors.email)}
            autoComplete="email"
          />
          {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Contraseña</Label>
          <PasswordInput
            id="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={Boolean(fieldErrors.password)}
            autoComplete="new-password"
            maxLength={72}
          />
          <PasswordChecklist password={password} />
          {fieldErrors.password && <p className="text-xs text-destructive">{fieldErrors.password}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm">Confirmar contraseña</Label>
          <PasswordInput
            id="confirm"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            aria-invalid={Boolean(fieldErrors.confirm)}
            autoComplete="new-password"
          />
          {fieldErrors.confirm && <p className="text-xs text-destructive">{fieldErrors.confirm}</p>}
        </div>

        <Button type="submit" size="lg" disabled={isLoading} className="mt-2">
          {isLoading && <Loader2 className="animate-spin" />}
          Crear cuenta
        </Button>
      </form>
    </AuthLayout>
  )
}
