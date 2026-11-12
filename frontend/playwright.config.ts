import { defineConfig, devices } from "@playwright/test"

/**
 * Pruebas de compatibilidad (CMP-01, RNF-07), accesibilidad (ACC-01, RNF-08) y
 * cabeceras de seguridad en producción (SEC-37, RNF-06).
 *
 * Requiere el backend en API_URL y el frontend en BASE_URL (igual que Cypress).
 * SEC-37 apunta a producción (PROD_URL) y solo corre en el proyecto "seguridad-prod".
 */
export default defineConfig({
  testDir: "./playwright/tests",
  outputDir: "./playwright/test-results",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 3,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "./playwright/report" }],
    ["json", { outputFile: "./playwright/test-results/results.json" }],
  ],
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    locale: "es-GT",
  },
  projects: [
    // Compatibilidad: el mismo flujo en los tres motores y en dos teléfonos.
    { name: "chromium", use: { ...devices["Desktop Chrome"] }, testIgnore: /seguridad-prod/ },
    { name: "firefox", use: { ...devices["Desktop Firefox"] }, testIgnore: /seguridad-prod|accesibilidad/ },
    { name: "webkit", use: { ...devices["Desktop Safari"] }, testIgnore: /seguridad-prod|accesibilidad/ },
    { name: "mobile-chrome", use: { ...devices["Pixel 5"] }, testIgnore: /seguridad-prod|accesibilidad/ },
    { name: "mobile-safari", use: { ...devices["iPhone 13"] }, testIgnore: /seguridad-prod|accesibilidad/ },
    // SEC-37: revisa las cabeceras HTTP del frontend desplegado.
    { name: "seguridad-prod", testMatch: /seguridad-prod/ },
  ],
})
