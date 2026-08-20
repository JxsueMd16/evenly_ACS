import { create } from "zustand"
import { persist } from "zustand/middleware"
import { loginRequest, registerRequest } from "@/lib/mockApi"
import type { User } from "@/lib/types"

/**
 * Global session state, built with Zustand instead of Context API:
 * - No provider wrapping needed — any screen (BottomNav, ProtectedRoute,
 *   Profile, Home greeting) can read the current user directly.
 * - `persist` gives us "stay logged in after refresh" via localStorage
 *   for free, which plain Context would need extra plumbing for.
 * - Selectors avoid the "every consumer re-renders on any change"
 *   problem Context has when the value is a single object.
 */
interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,
      async login(email, password) {
        set({ isLoading: true, error: null })
        try {
          const user = await loginRequest(email, password)
          set({ user, isLoading: false })
        } catch (err) {
          const message = err instanceof Error ? err.message : "No se pudo iniciar sesión."
          set({ isLoading: false, error: message })
          throw err
        }
      },
      async register(name, email, password) {
        set({ isLoading: true, error: null })
        try {
          const user = await registerRequest(name, email, password)
          set({ user, isLoading: false })
        } catch (err) {
          const message = err instanceof Error ? err.message : "No se pudo crear la cuenta."
          set({ isLoading: false, error: message })
          throw err
        }
      },
      logout() {
        set({ user: null, error: null })
      },
      clearError() {
        set({ error: null })
      },
    }),
    {
      name: "evenly-auth",
      partialize: (state) => ({ user: state.user }),
    },
  ),
)
