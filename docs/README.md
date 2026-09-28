# Documentación de QA — Evenly

Proyecto Final — Aseguramiento de la Calidad del Software (UMG). Avance 2: avance funcional.

| Documento | Contenido |
| --- | --- |
| [casos-de-prueba.md](casos-de-prueba.md) | Todos los casos de prueba (funcionales, límite, negativos, no funcionales, seguridad) con su resultado por ronda |
| [matriz-trazabilidad.md](matriz-trazabilidad.md) | Requisitos → casos de prueba → estado de cobertura |
| [pruebas-seguridad.md](pruebas-seguridad.md) | Casos de ciberseguridad ejecutados: validación de entradas, control de acceso, datos sensibles |
| [registro-defectos.md](registro-defectos.md) | Defectos con severidad, prioridad, pasos de reproducción, estado y regresión |
| [metricas.md](metricas.md) | Resumen de ejecución, tasa de éxito por ronda, defectos por severidad, tiempos de respuesta |
| [api/](api/) | Colección Postman (Apidog/Newman), environments y especificación OpenAPI |
| [despliegue.md](despliegue.md) | Cómo se despliega (Render + Vercel + Neon) y configuración inicial |
| [evidencias/](evidencias/) | Salidas reales de Newman, Cypress, reportes JUnit y capturas |

## Estrategia de pruebas

| Nivel | Herramienta | Dónde | Qué cubre |
| --- | --- | --- | --- |
| Unitarias | Vitest | `backend/src/lib/*.test.ts` | Dinero en centavos, reparto equitativo, balances y pagos sugeridos |
| API | Newman / Apidog | `docs/api/evenly.postman_collection.json` | Todos los endpoints: flujos felices, negativos, límites y seguridad |
| E2E | Cypress | `frontend/cypress/e2e/` | Flujos de usuario en el navegador (viewport móvil 390×844) |
| CI | GitHub Actions | `.github/workflows/ci.yml` | Corre todo lo anterior en cada push/PR a `main` y `develop` contra un PostgreSQL limpio |

## Cómo ejecutar las pruebas localmente

Requisitos: Node 24, pnpm 11, `backend/.env` configurado (ver `backend/.env.example`).

```bash
# 1. Backend
cd backend
pnpm install
pnpm db:deploy      # aplica migraciones
pnpm db:seed        # usuarios demo (contraseña: Evenly2026!)
pnpm dev            # http://localhost:3000

# 2. Pruebas unitarias (otra terminal)
cd backend && pnpm test

# 3. Pruebas de API con Newman (backend corriendo)
cd backend && pnpm test:api      # genera docs/evidencias/newman-junit.xml

# 4. Frontend
cd frontend
pnpm install
pnpm dev            # http://localhost:5173

# 5. Pruebas E2E con Cypress (backend y frontend corriendo)
cd frontend && pnpm cy:run       # headless
cd frontend && pnpm cy:open      # interfaz gráfica
```

> **Cypress desde la terminal de VS Code:** VS Code define `ELECTRON_RUN_AS_NODE=1` y Cypress falla con
> `bad option: --smoke-test`. Córrelo desde una terminal externa o así (Git Bash):
> `env -u ELECTRON_RUN_AS_NODE pnpm cy:run`. En PowerShell: `Remove-Item Env:ELECTRON_RUN_AS_NODE; pnpm cy:run`.

> **Límite de intentos:** login y registro aceptan `AUTH_RATE_LIMIT` peticiones por IP cada 15 minutos (50 por
> defecto). Newman y Cypress juntos registran unos 60 usuarios, así que para correr la suite completa pon
> `AUTH_RATE_LIMIT=1000` en tu `backend/.env` (CI ya lo hace). Si ves `429 TOO_MANY_REQUESTS`, reinicia el backend.

## Cuentas demo (seed)

| Correo | Contraseña | Grupos |
| --- | --- | --- |
| paul@evenly.app | Evenly2026! | Viaje a la playa, Depa compartido, Asado del finde (admin de los 3) |
| ana@evenly.app | Evenly2026! | Viaje a la playa, Depa compartido |
| kevin@evenly.app | Evenly2026! | Viaje a la playa, Asado del finde |
| mariana@evenly.app | Evenly2026! | Depa compartido, Asado del finde |

Newman y Cypress crean sus propios usuarios (`qa.*@evenly.test`, `e2e.*@evenly.test`) en cada ejecución, así que no
dependen del seed y se pueden repetir.

## Para Alexis (API / Apidog)

1. Apidog → Import → Postman → `docs/api/evenly.postman_collection.json` (trae scripts de prueba y variables).
2. Importa también `docs/api/evenly-local.postman_environment.json` (y el de producción cuando exista la URL de Render).
3. Opcional: Import → OpenAPI → `docs/api/openapi.yaml` para tener la documentación de cada endpoint y sus esquemas.
4. La colección está pensada para correr en orden (las carpetas 01→07 comparten variables como `tokenA`, `groupId`).
5. Al agregar casos, usa el siguiente ID libre (`API-48`, `SEC-18`, `E2E-19`…) y agrégalo a `casos-de-prueba.md` y a la matriz.

## Para Picon (E2E / Cypress)

- Los comandos personalizados (`cy.registerByApi`, `cy.loginAs`, `cy.createGroupByApi`) están en
  `frontend/cypress/support/commands.ts` y evitan pasar por la UI para preparar datos.
- Specs: `01-auth`, `02-grupos-gastos`, `03-seguridad`, `04-gestion-grupo` (ajustes, integrantes, eliminar) y
  `05-actividad-perfil`. Los botones de ícono se localizan por `aria-label` ("Ajustes del grupo",
  "Quitar a <nombre>", "Eliminar gasto <descripción>").
- Queda pendiente el caso **USA-01** (prueba de usabilidad con usuarios) — ver `casos-de-prueba.md`.
