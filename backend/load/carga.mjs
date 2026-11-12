/**
 * PERF-01 (RNF-01): prueba de carga con autocannon.
 *
 * 20 usuarios concurrentes durante 30 s haciendo las lecturas más frecuentes de
 * la app (Inicio y detalle de grupo): GET /groups, GET /debts, GET /groups/:id
 * y GET /health. Solo lecturas: no ensucia la base de datos.
 *
 * Criterio de aceptación: p97.5 < 3000 ms (más estricto que el p95 del plan) y
 * 0 % de errores (respuestas distintas de 2xx o fallas de conexión).
 *
 * Uso:  pnpm test:load              (contra http://localhost:3000)
 *       API_URL=... pnpm test:load  (otro entorno; no usar contra producción)
 */
import autocannon from "autocannon"

const API_URL = process.env.API_URL ?? "http://localhost:3000"
const CONNECTIONS = Number(process.env.CONNECTIONS ?? 20)
const DURATION = Number(process.env.DURATION ?? 30)
const P_LIMIT_MS = 3000

async function post(path, body, token) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`${path} → ${res.status} ${await res.text()}`)
  return res.json()
}

// Datos de la prueba: 2 usuarios, un grupo y 3 gastos.
const unique = `${Date.now().toString(36)}${Math.floor(Math.random() * 9000 + 1000)}`
const password = "Prueba2026!"
const a = await post("/auth/register", { name: "Carga A", email: `load.a.${unique}@evenly.test`, password })
const b = await post("/auth/register", { name: "Carga B", email: `load.b.${unique}@evenly.test`, password })
const { group } = await post("/groups", { name: "Carga", memberIds: [b.user.id] }, a.token)
for (const [description, amount] of [["Almuerzo", 120], ["Taxi", 35], ["Café", 28.5]]) {
  await post(
    `/groups/${group.id}/expenses`,
    { description, amount, paidById: a.user.id, splitType: "equal", participants: [{ userId: a.user.id }, { userId: b.user.id }] },
    a.token,
  )
}

const auth = { Authorization: `Bearer ${b.token}` }
console.log(`PERF-01: ${CONNECTIONS} conexiones durante ${DURATION} s contra ${API_URL}\n`)

const result = await autocannon({
  url: API_URL,
  connections: CONNECTIONS,
  duration: DURATION,
  requests: [
    { method: "GET", path: "/groups", headers: auth },
    { method: "GET", path: "/debts", headers: auth },
    { method: "GET", path: `/groups/${group.id}`, headers: auth },
    { method: "GET", path: "/health" },
  ],
})

console.log(autocannon.printResult(result, { renderLatencyTable: true, renderResultsTable: true }))

const total = result.requests.total
const errors = result.errors + result.timeouts + result.non2xx
const errorRate = total ? (errors / total) * 100 : 100
const p975 = result.latency.p97_5
const pass = p975 < P_LIMIT_MS && errors === 0

console.log("Resumen PERF-01")
console.log(`  Peticiones:        ${total} (${result.requests.average.toFixed(1)} por segundo en promedio)`)
console.log(`  Latencia promedio: ${result.latency.average.toFixed(0)} ms`)
console.log(`  p50 / p90 / p97.5 / p99 / máx.: ${result.latency.p50} / ${result.latency.p90} / ${p975} / ${result.latency.p99} / ${result.latency.max} ms`)
console.log(`  Errores:           ${errors} (${errorRate.toFixed(2)} %) — non2xx ${result.non2xx}, errores ${result.errors}, timeouts ${result.timeouts}`)
console.log(`  Criterio: p97.5 < ${P_LIMIT_MS} ms y 0 errores → ${pass ? "PASA" : "FALLA"}`)
process.exit(pass ? 0 : 1)
