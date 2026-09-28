# Evenly

Gestor de gastos compartidos para grupos. Proyecto Final — Aseguramiento de la Calidad del Software (UMG).

| Carpeta | Contenido |
| --- | --- |
| [backend/](backend/) | API REST: Node.js + Express + TypeScript + Prisma (PostgreSQL en Neon) |
| [frontend/](frontend/) | App web: React + Vite + TypeScript + Tailwind + shadcn/ui + Zustand; pruebas E2E con Cypress |
| [docs/](docs/) | Documentación de QA: casos de prueba, trazabilidad, defectos, seguridad, métricas, colección de API y evidencias |
| [.github/workflows/](.github/workflows/) | CI: typecheck, pruebas unitarias, build, Newman y Cypress contra un PostgreSQL limpio |
| [render.yaml](render.yaml) | Blueprint de despliegue del backend en Render |

## Arranque rápido

```bash
# Backend
cd backend
cp .env.example .env          # completa DATABASE_URL y JWT_SECRET
pnpm install
pnpm db:deploy && pnpm db:seed
pnpm dev                      # http://localhost:3000

# Frontend (otra terminal)
cd frontend
cp .env.example .env.local
pnpm install
pnpm dev                      # http://localhost:5173
```

Cuenta demo: `paul@evenly.app` / `Evenly2026!` (hay más en [docs/README.md](docs/README.md#cuentas-demo-seed)).

## Pruebas

| Comando | Dónde | Qué corre |
| --- | --- | --- |
| `pnpm test` | backend | Unitarias (Vitest) |
| `pnpm test:api` | backend | Colección de API con Newman (requiere el backend corriendo) |
| `pnpm cy:run` | frontend | E2E con Cypress (requiere backend y frontend corriendo) |

Detalles, cuentas de prueba y notas para el equipo de QA en [docs/README.md](docs/README.md).

## API

Especificación completa en [docs/api/openapi.yaml](docs/api/openapi.yaml). Resumen:

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/health` | Estado del servicio y de la base de datos |
| POST | `/auth/register`, `/auth/login` | Registro e inicio de sesión (devuelven un JWT) |
| GET | `/auth/me` | Usuario de la sesión |
| GET | `/users?search=` | Buscar usuarios para agregarlos a un grupo |
| GET / POST | `/groups` | Mis grupos / crear grupo |
| GET / PATCH / DELETE | `/groups/:id` | Detalle con balances / editar / eliminar (admin) |
| POST / DELETE | `/groups/:id/members[/:userId]` | Gestionar integrantes |
| GET / POST | `/groups/:id/expenses` | Gastos del grupo / registrar gasto |
| GET / DELETE | `/groups/:id/expenses/:expenseId` | Detalle / eliminar gasto |
| GET | `/activity` | Actividad reciente e historial de pagos |
