# Matriz de trazabilidad — Evenly

**Fecha:** 2026-09-27 · Relaciona cada requisito con su implementación, sus casos de prueba y el resultado de la última ronda.

## Requisitos

### Funcionales

| ID | Requisito | Implementación (backend) | Implementación (frontend) |
| --- | --- | --- | --- |
| RF-01 | Registrar una cuenta con nombre, correo y contraseña | `POST /auth/register` | `RegisterPage.tsx` |
| RF-02 | Iniciar sesión y obtener un token JWT | `POST /auth/login` | `LoginPage.tsx`, `authStore.ts` |
| RF-03 | Mantener la sesión, proteger rutas y cerrar sesión (también cuando el token expira) | `GET /auth/me`, `requireAuth` | `ProtectedRoute.tsx`, `api.ts` (401 → logout) |
| RF-04 | Buscar usuarios por nombre o correo para agregarlos a un grupo | `GET /users?search=` | `CreateGroupDialog.tsx` |
| RF-05 | Crear un grupo con integrantes (el creador queda como admin) | `POST /groups` | `CreateGroupDialog.tsx` |
| RF-06 | Ver mis grupos y el detalle de cada uno | `GET /groups`, `GET /groups/:id` | `HomePage`, `GroupsListPage`, `GroupDetailPage` |
| RF-07 | Editar y eliminar un grupo; gestionar integrantes (solo admin); salir del grupo | `PATCH/DELETE /groups/:id`, `/groups/:id/members` | `GroupSettingsDialog.tsx` |
| RF-08 | Registrar un gasto con división equitativa o por ítem | `POST /groups/:id/expenses` | `AddExpensePage.tsx` |
| RF-09 | Listar y eliminar gastos de un grupo | `GET/DELETE /groups/:id/expenses[/:eid]` | `GroupDetailPage.tsx` (listado y botón eliminar) |
| RF-10 | Calcular balances por integrante y pagos sugeridos para quedar a mano | `lib/balances.ts`, `GET /groups/:id` | `GroupDetailPage.tsx`, `HomePage.tsx` |
| RF-11 | Ver la actividad reciente y el historial de pagos propios | `GET /activity` | `ActivityPage.tsx`, `ProfilePage.tsx` |

### No funcionales

| ID | Requisito | Criterio de aceptación |
| --- | --- | --- |
| RNF-01 | Rendimiento y disponibilidad | Respuestas de la API en menos de 3 s; `/health` verifica la base de datos |
| RNF-02 | Manejo de errores consistente | Todo error tiene la forma `{ error: { code, message } }` y un mensaje en español, sin detalles internos |
| RNF-03 | Usabilidad y manejo de errores en la UI | Validación en el cliente con mensajes claros; ante un error no se pierde el estado del formulario |
| RNF-04 | Seguridad: validación de entradas | Rechazo de tipos, rangos y campos inválidos; sin inyección SQL ni LIKE; límite de tamaño y de intentos |
| RNF-05 | Seguridad: control de acceso | Un usuario no puede ver ni modificar grupos o gastos ajenos; permisos por rol |
| RNF-06 | Seguridad: datos sensibles | Contraseñas con bcrypt; sin hashes, contraseñas ni montos en respuestas de error ni en logs |

## Matriz requisito → casos

| Requisito | Casos de prueba | Total | Automatizados | Última ronda | Cobertura |
| --- | --- | --- | --- | --- | --- |
| RF-01 | API-02, API-03, API-04, API-05, API-06, API-07, API-08, API-09, E2E-01, E2E-02 | 10 | 10 | 10 pasan | Completa |
| RF-02 | API-10, API-11, API-12, E2E-03 | 4 | 4 | 4 pasan | Completa |
| RF-03 | API-13, API-14, E2E-04, E2E-05 | 4 | 4 | 4 pasan | Completa |
| RF-04 | API-15, E2E-06, E2E-12 | 3 | 3 | 3 pasan | Completa |
| RF-05 | API-16, API-17, E2E-06 | 3 | 3 | 3 pasan | Completa |
| RF-06 | API-18, API-33 | 2 | 2 | 2 pasan | Completa |
| RF-07 | API-19, API-37 a API-47, SEC-06, E2E-11, E2E-12, E2E-13, E2E-15, E2E-16 | 19 | 19 | 19 pasan | Completa |
| RF-08 | API-20 a API-29, E2E-07, E2E-08, E2E-09, UT-02, UT-03, UT-04 | 16 | 16 | 16 pasan | Completa |
| RF-09 | API-30, API-31, API-32, SEC-10, E2E-14 | 5 | 5 | 5 pasan | Completa |
| RF-10 | API-33, E2E-07, E2E-14, E2E-18, UT-01, UT-05, UT-06 | 7 | 7 | 7 pasan | Completa |
| RF-11 | API-34, API-35, E2E-17, E2E-18 | 4 | 4 | 4 pasan | Completa |
| RNF-01 | RNF-01, API-01 | 2 | 2 | 2 pasan | Completa |
| RNF-02 | RNF-02, API-36, SEC-11 | 3 | 3 | 3 pasan | Completa |
| RNF-03 | E2E-02, E2E-03, E2E-08, E2E-13, USA-01 | 5 | 4 | 4 pasan, 1 pendiente | Parcial: falta USA-01 |
| RNF-04 | SEC-01, SEC-03, SEC-07, SEC-12, SEC-14, SEC-15, API-09, E2E-09 | 8 | 8 | 8 pasan | Completa |
| RNF-05 | SEC-02, SEC-04, SEC-05, SEC-06, SEC-08, SEC-09, SEC-10, API-37, API-42, API-45, API-47, E2E-05, E2E-10, E2E-14, E2E-15 | 15 | 15 | 15 pasan | Completa |
| RNF-06 | SEC-09, SEC-11, SEC-13, SEC-14, SEC-16, SEC-17, API-12 | 7 | 7 | 7 pasan | Completa |

Un mismo caso puede cubrir varios requisitos, así que la columna "Total" no suma los 91 casos.

## Matriz defecto → casos de regresión

| Defecto | Requisito afectado | Caso que lo detectó | Casos de regresión | Resultado de la regresión |
| --- | --- | --- | --- | --- |
| DEF-001 | RF-08, RF-10 | Revisión estática | UT-03, API-20 | Pasan |
| DEF-002 | RNF-04, RNF-06 | SEC-14 | SEC-14, SEC-03, API-15 | Pasan |
| DEF-003 | RF-08 | E2E-07, E2E-08 | E2E-01 a E2E-10 (suite completa) | Pasan |
| DEF-004 | RF-01 | Revisión estática | API-07, E2E-02 | Pasan |
| DEF-005 | RF-08, RF-10 | Revisión estática | API-22, E2E-08 | Pasan |

## Huecos de cobertura identificados

Los huecos de RF-07 (integrantes) y RF-11 (Actividad y Perfil en la UI) que se detectaron en la ronda 2 se cerraron en la ronda 3 con API-40 a API-47 y E2E-11 a E2E-18. Quedan:

1. **RNF-03 — usabilidad:** USA-01 está pendiente de ejecutar (responsable: Picon).
2. **RNF-01 — carga:** solo se mide el tiempo de respuesta con un usuario. Queda fuera del alcance de este avance una prueba de carga (por ejemplo, k6 con 20 usuarios concurrentes).
