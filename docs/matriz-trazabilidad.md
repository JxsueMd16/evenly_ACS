# Matriz de trazabilidad — Evenly

**Versión:** 2.0 · **Fecha:** 2026-11-11 · Relaciona cada requisito con su implementación, sus casos de prueba
(`casos-de-prueba.md`) y el resultado de la última ronda (R8). Un mismo caso puede cubrir varios requisitos.

## 1. Requisitos funcionales → implementación

| ID | Requisito | Backend | Frontend |
| --- | --- | --- | --- |
| RF-01 | Registrar una cuenta con nombre, correo y contraseña | `POST /auth/register` | `RegisterPage.tsx` |
| RF-02 | Iniciar sesión y obtener un token JWT | `POST /auth/login` | `LoginPage.tsx`, `authStore.ts` |
| RF-03 | Mantener la sesión, proteger rutas y cerrar sesión (también al vencer el token) | `GET /auth/me`, `requireAuth` | `ProtectedRoute.tsx`, `api.ts` |
| RF-04 | Buscar usuarios por nombre o correo | `GET /users?search=` | `UserSearchField.tsx`, `CreateGroupDialog.tsx` |
| RF-05 | Crear un grupo con integrantes (el creador queda como admin) | `POST /groups` | `CreateGroupDialog.tsx` |
| RF-06 | Ver mis grupos y el detalle de cada uno | `GET /groups`, `GET /groups/:id` | `HomePage.tsx`, `GroupsListPage.tsx`, `GroupDetailPage.tsx` |
| RF-07 | Editar y eliminar un grupo; gestionar integrantes; salir del grupo | `PATCH/DELETE /groups/:id`, `/groups/:id/members` | `GroupSettingsDialog.tsx` |
| RF-08 | Registrar un gasto (partes iguales o por ítems) | `POST /groups/:id/expenses`, `lib/bill.ts` | `BillForm.tsx`, `AddExpensePage.tsx` |
| RF-09 | Listar y eliminar gastos de un grupo | `GET/DELETE /groups/:id/expenses[/:eid]` | `GroupDetailPage.tsx`, `BillDetailDialog.tsx` |
| RF-10 | Calcular balances y pagos sugeridos | `lib/balances.ts`, `GET /groups/:id` | `GroupDetailPage.tsx`, `HomePage.tsx` |
| RF-11 | Ver la actividad reciente y el historial de pagos propios | `GET /activity` | `ActivityPage.tsx`, `ProfilePage.tsx` |
| RF-12 | Amigos: enviar, aceptar, rechazar y cancelar solicitudes; eliminar amistad | `/friends`, `lib/friendships.ts` | `FriendsPage.tsx`, `useFriends.ts` |
| RF-13 | Invitar a un grupo con un enlace y unirse con él | `/groups/:id/invite`, `/invites/:code` | `InviteDialog.tsx`, `JoinGroupPage.tsx` |
| RF-14 | Notificaciones en tiempo real (contadores y avisos) | `/notifications`, `/notifications/stream`, `lib/notificationHub.ts` | `notificationStream.ts`, `AppShell.tsx`, `BottomNav.tsx` |
| RF-15 | Cuentas por ítems (unidades o compartidos) y con personas sueltas | `lib/bill.ts`, `POST /quick-bills` | `BillForm.tsx`, `QuickBillPage.tsx` |
| RF-16 | Datos bancarios y pagos en dos pasos con comprobante | `/me`, `/users/:id/payment-info`, `/groups/:id/payments` | `PaymentProfileSection.tsx`, `PayDialog.tsx`, `GroupPayments.tsx` |
| RF-17 | Deudas por persona y recordatorios de cobro | `GET /debts`, `POST /debts/remind`, `lib/debts.ts` | `HomePage.tsx`, `RemindButton.tsx` |

Los criterios de aceptación de RF-12 a RF-17 están en `plan-de-pruebas.md` (sección 5); los de UX-01 a UX-10 en
`requisitos-ux.md`.

## 2. Matriz requisito → casos

| Requisito | Casos de prueba | Total | Automatizados | Ejecutados y aprobados | Cobertura |
| --- | --- | --- | --- | --- | --- |
| RF-01 | API-02, API-03, API-04, API-05, API-06, API-07, API-08, API-09, API-63, API-64, E2E-01, E2E-02, E2E-19 | 13 | 13 | 13 | Completa |
| RF-02 | API-10, API-11, API-12, E2E-03 | 4 | 4 | 4 | Completa |
| RF-03 | API-13, API-14, SEC-02, E2E-04, E2E-05 | 5 | 5 | 5 | Completa |
| RF-04 | API-15, E2E-06 | 2 | 2 | 2 | Completa |
| RF-05 | API-16, API-17, E2E-06, E2E-21 | 4 | 4 | 4 | Completa |
| RF-06 | API-18 | 1 | 1 | 1 | Completa |
| RF-07 | API-19, API-37, API-38, API-39, API-40, API-41, API-42, API-43, API-44, API-45, API-46, API-47, E2E-11, E2E-12, E2E-13, E2E-15, E2E-16 | 17 | 17 | 17 | Completa |
| RF-08 | UT-01, UT-02, UT-03, UT-04, UT-08, UT-10, API-20, API-21, API-22, API-23, API-24, API-25, API-26, API-27, API-28, API-29, API-88, E2E-07 | 18 | 18 | 18 | Completa |
| RF-09 | API-30, API-31, API-32, E2E-14 | 4 | 4 | 4 | Completa |
| RF-10 | UT-05, UT-06, API-33, E2E-07, E2E-14 | 5 | 5 | 5 | Completa |
| RF-11 | API-34, API-35, E2E-17, E2E-18 | 4 | 4 | 4 | Completa |
| RF-12 | API-48, API-49, API-50, API-51, API-52, API-53, API-54, API-55, API-56, API-57, SEC-18, SEC-19, E2E-20, E2E-21 | 14 | 14 | 14 | Completa |
| RF-13 | API-58, API-59, API-60, API-61, API-62, SEC-20, SEC-21, SEC-22, SEC-23, E2E-22, E2E-23 | 11 | 11 | 11 | Completa |
| RF-14 | API-65, API-66, SEC-24, E2E-24, E2E-25 | 5 | 5 | 5 | Completa |
| RF-15 | UT-08, UT-09, API-67, API-68, API-69, API-70, API-71, API-72, API-73, SEC-25, E2E-08, E2E-26, E2E-27 | 13 | 13 | 13 | Completa |
| RF-16 | UT-07, API-74, API-75, API-76, API-77, API-78, API-79, API-80, API-81, API-82, API-83, API-84, API-85, API-86, SEC-26, SEC-27, SEC-28, SEC-29, SEC-30, SEC-31, E2E-28, E2E-29 | 22 | 22 | 22 | Completa |
| RF-17 | UT-13, API-87, API-92, API-93, API-94, API-95, SEC-32, SEC-33, SEC-34, SEC-35, E2E-32 | 11 | 11 | 11 | Completa |
| UX-01 | E2E-31 | 1 | 1 | 1 | Completa |
| UX-02 | E2E-27 | 1 | 1 | 1 | Completa |
| UX-03 | E2E-07 | 1 | 1 | 1 | Completa |
| UX-04 | API-91, E2E-30 | 2 | 2 | 2 | Completa |
| UX-05 | UT-11, UT-12, API-88, API-89, API-90, E2E-31 | 6 | 6 | 6 | Completa |
| UX-06 | UT-13, API-92, API-93, E2E-25, E2E-33 | 5 | 5 | 5 | Completa |
| UX-07 | E2E-29, E2E-30 | 2 | 2 | 2 | Completa |
| UX-08 | UT-14, API-94, API-95, SEC-36, E2E-32, E2E-33 | 6 | 6 | 6 | Completa |
| UX-09 | E2E-29 | 1 | 1 | 1 | Completa |
| UX-10 | E2E-01, E2E-34 | 2 | 2 | 2 | Completa |
| RNF-01 | API-01, RNF-01, PERF-01 | 3 | 2 | 2 | Parcial: falta PERF-01 |
| RNF-02 | API-36, SEC-11, RNF-02 | 3 | 3 | 3 | Completa |
| RNF-03 | E2E-02, E2E-03, E2E-08, E2E-13, E2E-19, E2E-23, E2E-34, USA-01 | 8 | 7 | 7 | Parcial: falta USA-01 |
| RNF-04 | SEC-01, SEC-03, SEC-07, SEC-11, SEC-12, SEC-14, SEC-15, SEC-23, SEC-25, SEC-26, SEC-29, SEC-35, SEC-36, E2E-09 | 14 | 13 | 14 | Completa |
| RNF-05 | SEC-02, SEC-04, SEC-05, SEC-06, SEC-08, SEC-09, SEC-10, SEC-18, SEC-19, SEC-20, SEC-21, SEC-22, SEC-24, SEC-30, SEC-31, SEC-32, SEC-33, SEC-34, E2E-10 | 19 | 19 | 19 | Completa |
| RNF-06 | SEC-13, SEC-14, SEC-16, SEC-17, SEC-27, SEC-28, SEC-37 | 7 | 4 | 6 | Parcial: falta SEC-37 |
| RNF-07 | CMP-01 | 1 | 0 | 0 | **Pendiente** |
| RNF-08 | ACC-01 | 1 | 0 | 0 | **Pendiente** |

### Requisitos no funcionales: criterio de aceptación

| ID | Requisito | Criterio |
| --- | --- | --- |
| RNF-01 | Rendimiento y disponibilidad | < 3 s por respuesta; `/health` verifica la BD; carga 20 usuarios con p95 < 3 s |
| RNF-02 | Manejo de errores consistente | `{ error: { code, message } }` en español, sin detalles internos |
| RNF-03 | Usabilidad (= UX-NF-01) | ≥ 80 % de tareas sin ayuda; SUS ≥ 70 |
| RNF-04 | Seguridad: validación de entradas | Tipos, rangos y campos extra rechazados; sin inyección; límites de tamaño e intentos |
| RNF-05 | Seguridad: control de acceso | Nadie ve ni modifica recursos ajenos; permisos por rol |
| RNF-06 | Seguridad: datos sensibles | bcrypt; sin hashes ni tokens en respuestas, logs o URLs; headers de seguridad |
| RNF-07 | Compatibilidad | Chromium, Firefox y WebKit; viewport móvil |
| RNF-08 | Accesibilidad (= UX-NF-02) | Lighthouse móvil ≥ 90 |

## 3. Resumen de cobertura

| Métrica | Valor |
| --- | --- |
| Requisitos | 35 (17 funcionales, 10 de UX, 8 no funcionales) |
| Con al menos un caso diseñado | 35 de 35 (100.0 %) |
| Con cobertura completa (todos sus casos ejecutados y aprobados) | 30 (85.7 %) |
| Con cobertura parcial | 3: RNF-01, RNF-03, RNF-06 |
| Solo con casos pendientes | 2: RNF-07, RNF-08 |
| Sin ningún caso | 0 |

Los huecos que quedan son no funcionales y están programados en la ronda 9 del plan (carga con k6, compatibilidad con
Playwright, Lighthouse) y en USA-01 (prueba de usabilidad con compañeros).

## 4. Matriz defecto → casos de regresión

| Defecto | Requisito afectado | Detectado por | Casos de regresión | Resultado de la regresión |
| --- | --- | --- | --- | --- |
| DEF-001 | RF-08, RF-10 | Revisión estática | UT-03, API-20 | Pasan (R2 a R8) |
| DEF-002 | RNF-04, RNF-06 | SEC-14 | SEC-14, SEC-03, API-15 | Pasan (R2 a R8) |
| DEF-003 | RF-08 | E2E-07, E2E-08 | Suite E2E completa | Pasan (R2 a R8) |
| DEF-004 | RF-01 | Revisión estática | API-07, API-63, API-64, E2E-02, E2E-19 | Pasan (R2 a R8) |
| DEF-005 | RF-08, RF-10 | Revisión estática | API-22, E2E-08 | Pasan (R2 a R8) |
| DEF-006 | RNF-03, UX-10 | Evaluación heurística de UX | E2E-34 | Pasa (R8b) |
| DEF-007 | RNF-03, UX-02 | Prueba exploratoria en viewport móvil | E2E-27 + revisión visual | Pasa (R8) |
| DEF-008 | RNF-06 | Revisión de cabeceras HTTP en producción | SEC-37 | Pendiente (ronda 9) |
