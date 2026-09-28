import { useState, type FormEvent } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { AuthLayout } from "./AuthLayout"
import { Button } from "@/components/ui/button"
import { UnderlineInput } from "@/components/ui/underline-input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/PasswordInput"
import { useAuthStore } from "@/store/authStore"

export function LoginPage() {
  const login = useAuthStore((s) => s.login)
  const isLoading = useAuthStore((s) => s.isLoading)
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})

  function validate() {
    const errors: typeof fieldErrors = {}
    if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = "Ingresa un correo válido."
    if (!password) errors.password = "Ingresa tu contraseña."
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    try {
      await login(email, password)
      const from = (location.state as { from?: string } | null)?.from ?? "/"
      navigate(from, { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo iniciar sesión.")
    }
  }

  function useDemoAccount() {
    setEmail("paul@evenly.app")
    setPassword("Evenly2026!")
  }

  return (
    <AuthLayout
      heading="Inicia sesión"
      subtitle="Organiza y divide gastos con tu grupo"
      footer={
        <>
          ¿No tienes cuenta?{" "}
          <Link to="/register" state={location.state} className="font-semibold text-primary">
            Regístrate
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
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
            autoComplete="current-password"
          />
          {fieldErrors.password && <p className="text-xs text-destructive">{fieldErrors.password}</p>}
        </div>

        <Button type="submit" size="lg" disabled={isLoading} className="mt-2">
          {isLoading && <Loader2 className="animate-spin" />}
          Iniciar sesión
        </Button>

        <Button type="button" variant="ghost" onClick={useDemoAccount} disabled={isLoading}>
          Usar cuenta demo
        </Button>
      </form>
    </AuthLayout>
  )
}
