/**
 * ACC-01 (RNF-08): auditoría Lighthouse (móvil) de Accesibilidad y Buenas prácticas
 * en Login, Inicio, detalle de grupo y formulario de gasto, con sesión iniciada.
 *
 * Usa el build de producción servido con `pnpm preview` (más fiel que el servidor de
 * desarrollo) y el backend local. Guarda un reporte HTML por pantalla.
 *
 * Uso: pnpm build && pnpm preview --port 4173   (otra terminal)
 *      pnpm lighthouse
 */
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import lighthouse from "lighthouse"
import { chromium } from "@playwright/test"

const BASE_URL = process.env.BASE_URL ?? "http://localhost:4173"
const API_URL = process.env.API_URL ?? "http://localhost:3000"
const OUT_DIR = process.env.OUT_DIR ?? path.resolve("../docs/evidencias/lighthouse-ronda9")
const PORT = 9223
const MIN_SCORE = 90

async function post(p, body, token) {
  const res = await fetch(`${API_URL}${p}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`${p} → ${res.status}`)
  return res.json()
}

const unique = `${Date.now().toString(36)}${Math.floor(Math.random() * 9000 + 1000)}`
const me = await post("/auth/register", { name: "Lighthouse Uno", email: `lh.a.${unique}@evenly.test`, password: "Prueba2026!" })
const friend = await post("/auth/register", { name: "Lighthouse Dos", email: `lh.b.${unique}@evenly.test`, password: "Prueba2026!" })
const { group } = await post("/groups", { name: "Auditoría", memberIds: [me.user.id] }, friend.token)
await post(
  `/groups/${group.id}/expenses`,
  { description: "Almuerzo", amount: 60, paidById: friend.user.id, splitType: "equal", participants: [{ userId: friend.user.id }, { userId: me.user.id }] },
  friend.token,
)

const profile = fs.mkdtempSync(path.join(os.tmpdir(), "evenly-lh-"))
const context = await chromium.launchPersistentContext(profile, { headless: true, args: [`--remote-debugging-port=${PORT}`] })
const page = context.pages()[0] ?? (await context.newPage())

const screens = [
  { name: "login", url: "/login", auth: false },
  { name: "inicio", url: "/", auth: true },
  { name: "grupo", url: `/groups/${group.id}`, auth: true },
  { name: "formulario-gasto", url: `/groups/${group.id}/add-expense`, auth: true },
]

fs.mkdirSync(OUT_DIR, { recursive: true })
const summary = []
let ok = true
for (const s of screens) {
  await page.goto(`${BASE_URL}/login`)
  await page.evaluate(
    ({ auth, u, token }) => {
      if (auth) localStorage.setItem("evenly-auth", JSON.stringify({ state: { user: { ...u, avatarColor: "sky" }, token }, version: 1 }))
      else localStorage.removeItem("evenly-auth")
    },
    { auth: s.auth, u: { id: me.user.id, name: me.user.name, email: me.user.email }, token: me.token },
  )
  const result = await lighthouse(`${BASE_URL}${s.url}`, {
    port: PORT,
    output: "html",
    onlyCategories: ["accessibility", "best-practices"],
    disableStorageReset: true,
    logLevel: "error",
  })
  const a11y = Math.round(result.lhr.categories.accessibility.score * 100)
  const bp = Math.round(result.lhr.categories["best-practices"].score * 100)
  const failed = Object.values(result.lhr.audits)
    .filter((a) => a.score !== null && a.score < 1 && a.scoreDisplayMode === "binary")
    .map((a) => a.id)
  fs.writeFileSync(path.join(OUT_DIR, `${s.name}.html`), result.report)
  summary.push({ pantalla: s.name, accesibilidad: a11y, buenasPracticas: bp, auditoriasFallidas: failed })
  if (a11y < MIN_SCORE) ok = false
  console.log(`${s.name.padEnd(18)} Accesibilidad ${a11y}  ·  Buenas prácticas ${bp}  ${failed.length ? "· fallan: " + failed.join(", ") : ""}`)
}
await context.close()
fs.writeFileSync(path.join(OUT_DIR, "resumen.json"), JSON.stringify(summary, null, 2))
console.log(`\nCriterio: Accesibilidad ≥ ${MIN_SCORE} en todas las pantallas → ${ok ? "PASA" : "FALLA"}`)
console.log(`Reportes en ${OUT_DIR}`)
process.exit(ok ? 0 : 1)
