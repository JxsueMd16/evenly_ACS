/**
 * Política de contraseñas. Debe coincidir con `passwordSchema` en
 * backend/src/lib/schemas.ts: el backend vuelve a validarla.
 */
export const PASSWORD_RULES = [
  { id: "length", label: "Mínimo 8 caracteres", test: (p: string) => p.length >= 8 && p.length <= 72 },
  { id: "lower", label: "Una letra minúscula", test: (p: string) => /[a-z]/.test(p) },
  { id: "upper", label: "Una letra mayúscula", test: (p: string) => /[A-Z]/.test(p) },
  { id: "number", label: "Un número", test: (p: string) => /[0-9]/.test(p) },
  { id: "symbol", label: "Un símbolo (!@#$…)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const

export function isStrongPassword(password: string) {
  return PASSWORD_RULES.every((rule) => rule.test(password))
}
