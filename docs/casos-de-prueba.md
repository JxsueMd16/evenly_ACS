# Casos de prueba — Evenly

**Versión:** 2.0 · **Fecha:** 2026-11-11 · **Rama:** `main`

Generado a partir de la colección de Newman (`docs/api/evenly.postman_collection.json`), los specs de Cypress
(`frontend/cypress/e2e/`), las pruebas unitarias (`backend/src/lib/*.test.ts`) y las evidencias de cada ronda
(`docs/evidencias/`). El plan que define la estrategia está en [plan-de-pruebas.md](plan-de-pruebas.md).

## Convenciones

| Prefijo | Nivel | Herramienta |
| --- | --- | --- |
| `UT-` | Unitaria | Vitest |
| `API-` | API funcional | Newman / Apidog |
| `SEC-` | Seguridad | Newman o script |
| `E2E-` | Interfaz (viewport móvil 390 × 844) | Cypress |
| `RNF-`, `PERF-`, `CMP-`, `ACC-` | No funcional | Newman, autocannon, Playwright + axe-core, Lighthouse |
| `USA-` | Usabilidad | Manual + cuestionario SUS |

**Tipo:** F funcional · N negativo · L valor límite · S seguridad · NF no funcional.
**Técnica:** PE partición de equivalencia · VL valores límite · TE transición de estados · TD tabla de decisión
(permisos por rol) · EG conjetura de errores.
**Resultado esperado (API):** código HTTP y nombres de las aserciones del caso en la colección.

## Rondas de ejecución

| Ronda | Fecha | Motivo | Evidencia |
| --- | --- | --- | --- |
| R1 | 2026-09-27 | Primera ejecución completa | `newman-ronda1-antes-de-corregir.txt`, `cypress-ronda1.txt` |
| R2 | 2026-09-27 | Regresión después de DEF-002 y DEF-003 | `*-ronda2-regresion.txt` |
| R3 | 2026-09-27 | Gestión de grupos, integrantes, actividad y perfil | `*-ronda3-interfaz-completa.txt` |
| R4 | 2026-09-27 | Amigos e invitaciones por enlace | `*-ronda4-social.txt` |
| R5 | 2026-09-27 | Notificaciones en tiempo real | `*-ronda5-notificaciones.txt` |
| R6 | 2026-09-27 | Cuentas por ítems, cuenta rápida, datos bancarios y pagos | `newman-ronda6-cuentas-pagos.txt` |
| R7 | 2026-11-11 | Regresión completa de la versión del Avance 2 | `newman-ronda7-final.txt`, `cypress-ronda6-final.txt`, `vitest-unitarias-ronda-final.txt` |
| R8 | 2026-11-11 | Mejoras de UX (UX-01 a UX-10) + regresión completa | `newman-ronda8-ux.txt`, `cypress-ronda7-ux.txt`, `vitest-unitarias-ronda-ux.txt` |
| R8b | 2026-11-11 | Regresión de DEF-006 (E2E-34) | `cypress-ronda8b-regresion-def006.txt` |
| R9 | 2026-11-12 | No funcionales y seguridad: compatibilidad (Playwright), accesibilidad (axe + Lighthouse), carga (autocannon), cabeceras del frontend; corrección de DEF-008 a DEF-010 y regresión completa | `playwright-ronda9-compat-a11y.txt`, `lighthouse-ronda9-acc01.txt`, `lighthouse-ronda9/`, `carga-ronda9-perf01.txt`, `cypress-ronda9-regresion.txt`, `newman-ronda9-regresion.txt`, `vitest-unitarias-ronda9.txt` |

Precondiciones generales: backend en `http://localhost:3000` con migraciones aplicadas; frontend en
`http://localhost:5173`. Newman registra sus propios usuarios en cada ejecución: **A** (admin), **B** y **D**
(integrantes), **C** (ajeno) y **E** (sin relación con A).

## 1. Autenticación y sesión

| ID | Nivel / herramienta | Tipo | Técnica | Descripción | Resultado esperado | Req. | Agregado | Última ejecución |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| API-02 | Newman | F | PE | Registro usuario A (admin del grupo) | 201; Devuelve token y usuario; No devuelve la contraseña ni su hash | RF-01 | R1 | Pasa (ronda 9) |
| API-03 | Newman | F | PE | Registro usuario B (integrante) | 201; Devuelve token y usuario; No devuelve la contraseña ni su hash | RF-01 | R1 | Pasa (ronda 9) |
| API-04 | Newman | F | TD | Registro usuario C (ajeno al grupo) | 201; Devuelve token y usuario; No devuelve la contraseña ni su hash | RF-01 | R1 | Pasa (ronda 9) |
| API-05 | Newman | F | PE | Registro usuario D (integrante) | 201; Devuelve token y usuario; No devuelve la contraseña ni su hash | RF-01 | R1 | Pasa (ronda 9) |
| API-06 | Newman | N | EG | Registro con correo duplicado | 409; EMAIL_TAKEN | RF-01 | R1 | Pasa (ronda 9) |
| API-07 | Newman | N | PE | Registro con contraseña débil | 400; VALIDATION_ERROR | RF-01 | R1 | Pasa (ronda 9) |
| API-08 | Newman | N | PE | Registro con correo inválido | 400; VALIDATION_ERROR | RF-01 | R1 | Pasa (ronda 9) |
| API-09 | Newman | N | EG | Registro con campo no permitido (asignación masiva) | 400; VALIDATION_ERROR | RF-01 | R1 | Pasa (ronda 9) |
| API-10 | Newman | F | PE | Login correcto | 200; Devuelve un JWT; La respuesta no expone hash, stack ni SQL | RF-02 | R1 | Pasa (ronda 9) |
| API-11 | Newman | N | PE | Login con contraseña incorrecta | 401; Mensaje genérico; La respuesta no expone hash, stack ni SQL | RF-02 | R1 | Pasa (ronda 9) |
| API-12 | Newman | N | EG | Login con correo inexistente (mismo mensaje) | 401; No revela si la cuenta existe | RF-02 | R1 | Pasa (ronda 9) |
| API-13 | Newman | N | TD | Perfil sin token | 401; UNAUTHORIZED | RF-03 | R1 | Pasa (ronda 9) |
| API-14 | Newman | F | PE | Perfil con token válido | 200; Es el usuario A; La respuesta no expone hash, stack ni SQL | RF-03 | R1 | Pasa (ronda 9) |
| API-63 | Newman | N | PE | Contraseña sin símbolo | 400; Explica que falta un símbolo | RF-01 | R4 | Pasa (ronda 9) |
| API-64 | Newman | N | PE | Contraseña sin mayúscula | 400; Explica que falta una mayúscula | RF-01 | R4 | Pasa (ronda 9) |
| E2E-01 | Cypress (`01-auth.cy.ts`) | F | PE | Registra una cuenta nueva y entra al inicio | Ver aserciones del spec | RF-01, UX-10 | R1 | Pasa (ronda 9) |
| E2E-02 | Cypress (`01-auth.cy.ts`) | N | PE | Valida la política de contraseña antes de llamar a la API | Ver aserciones del spec | RF-01, RNF-03 | R1 | Pasa (ronda 9) |
| E2E-03 | Cypress (`01-auth.cy.ts`) | N | PE | Muestra un error claro con credenciales incorrectas y no inicia sesión | Ver aserciones del spec | RF-02, RNF-03 | R1 | Pasa (ronda 9) |
| E2E-04 | Cypress (`01-auth.cy.ts`) | N | PE | Redirige a /login al abrir una ruta protegida sin sesión | Ver aserciones del spec | RF-03 | R1 | Pasa (ronda 9) |
| E2E-05 | Cypress (`01-auth.cy.ts`) | N | TE | Cierra la sesión si el token ya no es válido | Ver aserciones del spec | RF-03 | R1 | Pasa (ronda 9) |
| E2E-19 | Cypress (`06-amigos-invitaciones.cy.ts`) | F | PE | Muestra u oculta la contraseña y marca los requisitos mientras se escribe | Ver aserciones del spec | RF-01, RNF-03 | R4 | Pasa (ronda 9) |

## 2. Usuarios y grupos

| ID | Nivel / herramienta | Tipo | Técnica | Descripción | Resultado esperado | Req. | Agregado | Última ejecución |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| API-15 | Newman | F | PE | Buscar usuario por correo | 200; Encuentra a B | RF-04 | R1 | Pasa (ronda 9) |
| API-16 | Newman | N | PE | Crear grupo sin nombre | 400; VALIDATION_ERROR | RF-05 | R1 | Pasa (ronda 9) |
| API-17 | Newman | F | PE | Crear grupo con integrantes | 201; Tiene 3 integrantes y A es ADMIN; Balance inicial en 0 | RF-05 | R1 | Pasa (ronda 9) |
| API-18 | Newman | F | PE | Listar mis grupos | 200; B ve el grupo donde lo agregaron | RF-06 | R1 | Pasa (ronda 9) |
| API-19 | Newman | F | PE | Admin renombra el grupo | 200; Nombre actualizado | RF-07 | R1 | Pasa (ronda 9) |
| API-37 | Newman | N | TD | Integrante no admin intenta eliminar el grupo | 403 | RF-07 | R1 | Pasa (ronda 9) |
| API-38 | Newman | F | PE | Admin elimina el grupo | 204 | RF-07 | R1 | Pasa (ronda 9) |
| API-39 | Newman | N | TE | El grupo eliminado ya no existe | 404 | RF-07 | R1 | Pasa (ronda 9) |
| API-40 | Newman | F | PE | Admin agrega a un integrante | 201; C ahora es integrante | RF-07 | R3 | Pasa (ronda 9) |
| API-41 | Newman | N | PE | Agregar a alguien que ya es integrante | 409; ALREADY_MEMBER | RF-07 | R3 | Pasa (ronda 9) |
| API-42 | Newman | N | TD | Integrante no admin intenta agregar | 403; FORBIDDEN | RF-07 | R3 | Pasa (ronda 9) |
| API-43 | Newman | N | PE | Quitar a un integrante que participa en gastos | 409; MEMBER_HAS_EXPENSES | RF-07 | R3 | Pasa (ronda 9) |
| API-44 | Newman | N | PE | El admin intenta salir del grupo | 409; ADMIN_CANNOT_LEAVE | RF-07 | R3 | Pasa (ronda 9) |
| API-45 | Newman | N | TD | Integrante no admin intenta quitar a otro | 403; FORBIDDEN | RF-07 | R3 | Pasa (ronda 9) |
| API-46 | Newman | F | PE | Integrante sin gastos sale del grupo | 204 | RF-07 | R3 | Pasa (ronda 9) |
| API-47 | Newman | N | TE | Quien salió ya no ve el grupo | 404 | RF-07 | R3 | Pasa (ronda 9) |
| E2E-06 | Cypress (`02-grupos-gastos.cy.ts`) | F | PE | Crea un grupo buscando a un integrante por correo y entra a él | Ver aserciones del spec | RF-04, RF-05 | R1 | Pasa (ronda 9) |
| E2E-11 | Cypress (`04-gestion-grupo.cy.ts`) | F | PE | El admin renombra el grupo y cambia la categoría | Ver aserciones del spec | RF-07 | R3 | Pasa (ronda 9) |
| E2E-12 | Cypress (`04-gestion-grupo.cy.ts`) | F | PE | El admin agrega a un integrante buscándolo y luego lo quita | Ver aserciones del spec | RF-07 | R3 | Pasa (ronda 9) |
| E2E-13 | Cypress (`04-gestion-grupo.cy.ts`) | N | PE | No permite quitar a un integrante que participa en gastos y explica por qué | Ver aserciones del spec | RF-07, RNF-03 | R3 | Pasa (ronda 9) |
| E2E-15 | Cypress (`04-gestion-grupo.cy.ts`) | F | PE | Un integrante sin gastos sale del grupo | Ver aserciones del spec | RF-07 | R3 | Pasa (ronda 9) |
| E2E-16 | Cypress (`04-gestion-grupo.cy.ts`) | F | PE | El admin elimina el grupo | Ver aserciones del spec | RF-07 | R3 | Pasa (ronda 9) |

## 3. Gastos, balances y actividad

| ID | Nivel / herramienta | Tipo | Técnica | Descripción | Resultado esperado | Req. | Agregado | Última ejecución |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| UT-01 | Vitest (`money.test.ts`) | F | EG | Conversión a centavos sin error de punto flotante | 0.1 + 0.2 → 30; 62.5 → 6250 | RF-08 | R1 | Pasa (ronda 9) |
| UT-02 | Vitest (`money.test.ts`) | L | VL | Validación de máximo 2 decimales | Acepta 12, 12.5, 0.01, 999999.99; rechaza 12.345, 0.001 | RF-08 | R1 | Pasa (ronda 9) |
| UT-03 | Vitest (`money.test.ts`) | F | EG | Reparto equitativo con centavos sobrantes (DEF-001) | 100.00 entre 3 → 33.34 / 33.33 / 33.33 | RF-08 | R1 | Pasa (ronda 9) |
| UT-04 | Vitest (`money.test.ts`) | L | VL | Reparto en casos borde | 0.01 entre 3 → [0.01, 0, 0]; sin participantes → [] | RF-08 | R1 | Pasa (ronda 9) |
| UT-05 | Vitest (`balances.test.ts`) | F | PE | Balance neto del grupo del seed | Suma de balances = 0; integrante sin gastos = 0 | RF-10 | R1 | Pasa (ronda 9) |
| UT-06 | Vitest (`balances.test.ts`) | F | PE | Pagos sugeridos | Saldan el grupo con ≤ n − 1 pagos; ninguno si todos están en 0 | RF-10 | R1 | Pasa (ronda 9) |
| UT-08 | Vitest (`bill.test.ts`) | F | PE | Cuenta del almuerzo: partes iguales y por ítems | 85 entre 3 → 28.34/28.33/28.33; por ítems 30/35/20 | RF-08, RF-15 | R6 | Pasa (ronda 9) |
| UT-10 | Vitest (`bill.test.ts`) | L | VL | Total de la cuenta | Usa el monto sin ítems; exige ítems o monto; rechaza total ≠ suma y > 1,000,000 | RF-08 | R6 | Pasa (ronda 9) |
| API-20 | Newman | F | PE | Gasto equitativo 100.00 entre 3 (redondeo) | 201; Las partes suman exactamente el total (DEF-001); Reparto 33.34 / 33.33 / 33.33 | RF-08 | R1 | Pasa (ronda 9) |
| API-21 | Newman | F | PE | Gasto por ítem que cuadra | 201; Tipo itemized | RF-08 | R1 | Pasa (ronda 9) |
| API-22 | Newman | N | PE | Gasto por ítem que no cuadra | 400; SPLIT_MISMATCH | RF-08 | R1 | Pasa (ronda 9) |
| API-23 | Newman | L | VL | Monto 0 (límite inferior) | 400; VALIDATION_ERROR | RF-08 | R1 | Pasa (ronda 9) |
| API-24 | Newman | N | PE | Monto negativo | 400; VALIDATION_ERROR | RF-08 | R1 | Pasa (ronda 9) |
| API-25 | Newman | L | VL | Monto mínimo 0.01 (límite válido) | 201 | RF-08 | R1 | Pasa (ronda 9) |
| API-26 | Newman | L | VL | Monto máximo 1,000,000 (límite válido) | 201 | RF-08 | R1 | Pasa (ronda 9) |
| API-27 | Newman | L | VL | Monto 1,000,000.01 (sobre el límite) | 400; VALIDATION_ERROR | RF-08 | R1 | Pasa (ronda 9) |
| API-28 | Newman | L | VL | Monto con 3 decimales | 400; VALIDATION_ERROR | RF-08 | R1 | Pasa (ronda 9) |
| API-29 | Newman | N | PE | Participante que no es del grupo | 400; NOT_A_MEMBER | RF-08 | R1 | Pasa (ronda 9) |
| API-30 | Newman | L | VL | Admin elimina el gasto de límite superior | 204 | RF-09 | R1 | Pasa (ronda 9) |
| API-31 | Newman | F | PE | Admin elimina el gasto de 0.01 | 204 | RF-09 | R1 | Pasa (ronda 9) |
| API-32 | Newman | F | PE | Listar gastos del grupo | 200; Quedan 2 gastos, del más reciente al más antiguo | RF-09 | R1 | Pasa (ronda 9) |
| API-33 | Newman | F | PE | Balances del grupo | 200; La suma de balances es 0; A: +100 - 33.34 - 10.25 = 56.41; B: +30.50 - 33.33 - 20.25 = -23.08; D: -33.33; Pagos sugeridos saldan el grupo | RF-10 | R1 | Pasa (ronda 9) |
| API-34 | Newman | F | PE | Actividad reciente | 200; Incluye los gastos del grupo con su pagador | RF-11 | R1 | Pasa (ronda 9) |
| API-35 | Newman | F | PE | Historial de pagos (paidByMe) | 200; Solo gastos pagados por B | RF-11 | R1 | Pasa (ronda 9) |
| E2E-07 | Cypress (`02-grupos-gastos.cy.ts`) | F | PE | Registra una cuenta en partes iguales y actualiza el balance | Ver aserciones del spec | RF-08, RF-10, UX-03 | R1 | Pasa (ronda 9) · falló en la ronda 1 |
| E2E-14 | Cypress (`04-gestion-grupo.cy.ts`) | F | PE | Elimina una cuenta desde su detalle y los balances se recalculan; otros integrantes no pueden | Ver aserciones del spec | RF-09, RF-10 | R3 | Pasa (ronda 9) |
| E2E-17 | Cypress (`05-actividad-perfil.cy.ts`) | F | PE | La actividad muestra los gastos de mis grupos con quién pagó | Ver aserciones del spec | RF-11 | R3 | Pasa (ronda 9) |
| E2E-18 | Cypress (`05-actividad-perfil.cy.ts`) | F | PE | El perfil solo muestra en el historial los gastos que pagué y el balance total | Ver aserciones del spec | RF-11 | R3 | Pasa (ronda 9) |

## 4. Amigos e invitaciones

| ID | Nivel / herramienta | Tipo | Técnica | Descripción | Resultado esperado | Req. | Agregado | Última ejecución |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| API-48 | Newman | F | PE | A envía solicitud de amistad a B | 201; Queda pendiente | RF-12 | R4 | Pasa (ronda 9) |
| API-49 | Newman | N | EG | Solicitud duplicada | 409; REQUEST_PENDING | RF-12 | R4 | Pasa (ronda 9) |
| API-50 | Newman | N | PE | Solicitud a uno mismo | 400; SELF_FRIENDSHIP | RF-12 | R4 | Pasa (ronda 9) |
| API-51 | Newman | F | PE | B ve la solicitud recibida | 200; La solicitud de A está en recibidas | RF-12 | R4 | Pasa (ronda 9) |
| API-52 | Newman | F | TE | B acepta la solicitud | 200; Ahora son amigos | RF-12 | R4 | Pasa (ronda 9) |
| API-53 | Newman | F | PE | La búsqueda muestra la relación | 200; B aparece como amigo | RF-12 | R4 | Pasa (ronda 9) |
| API-54 | Newman | F | PE | D envía solicitud a A | 201 | RF-12 | R4 | Pasa (ronda 9) |
| API-55 | Newman | F | TE | Solicitud cruzada: A envía a D y quedan como amigos | 200; Quedan como amigos | RF-12 | R4 | Pasa (ronda 9) |
| API-56 | Newman | F | TE | A elimina la amistad con B | 204 | RF-12 | R4 | Pasa (ronda 9) |
| API-57 | Newman | F | PE | A ya no tiene a B como amigo | 200; B no está y D sí | RF-12 | R4 | Pasa (ronda 9) |
| API-58 | Newman | F | PE | Integrante obtiene el enlace de invitación | 200; URL-safe de 12 caracteres | RF-13 | R4 | Pasa (ronda 9) |
| API-59 | Newman | F | PE | Vista previa de la invitación | 200; Muestra el grupo y que C aún no es integrante; No expone correos ni montos | RF-13 | R4 | Pasa (ronda 9) |
| API-60 | Newman | F | PE | Unirse con el enlace | 201; Devuelve el grupo | RF-13 | R4 | Pasa (ronda 9) |
| API-61 | Newman | F | TE | Unirse otra vez no duplica | 200; Ya era integrante | RF-13 | R4 | Pasa (ronda 9) |
| API-62 | Newman | F | TE | El admin regenera el enlace | 201; El código cambió | RF-13 | R4 | Pasa (ronda 9) |
| E2E-20 | Cypress (`06-amigos-invitaciones.cy.ts`) | F | TE | Envía una solicitud de amistad y el otro la acepta | Ver aserciones del spec | RF-12 | R4 | Pasa (ronda 9) |
| E2E-21 | Cypress (`06-amigos-invitaciones.cy.ts`) | F | PE | Crea un grupo eligiendo a un amigo sin buscarlo | Ver aserciones del spec | RF-12, RF-05 | R4 | Pasa (ronda 9) |
| E2E-22 | Cypress (`06-amigos-invitaciones.cy.ts`) | F | PE | Quien abre el enlace sin sesión inicia sesión y se une al grupo | Ver aserciones del spec | RF-13 | R4 | Pasa (ronda 9) |
| E2E-23 | Cypress (`06-amigos-invitaciones.cy.ts`) | N | PE | Un enlace inválido muestra un mensaje claro | Ver aserciones del spec | RF-13, RNF-03 | R4 | Pasa (ronda 9) |

## 5. Notificaciones en tiempo real

| ID | Nivel / herramienta | Tipo | Técnica | Descripción | Resultado esperado | Req. | Agregado | Última ejecución |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| API-65 | Newman | F | PE | Contadores de avisos | 200; B debe 23.08 en 1 grupo y no tiene solicitudes | RF-14 | R5 | Pasa (ronda 9) |
| API-66 | Newman | N | TD | Contadores sin sesión | 401 | RF-14 | R5 | Pasa (ronda 9) |
| E2E-24 | Cypress (`07-notificaciones.cy.ts`) | F | PE | Una solicitud de amistad aparece al instante en la barra, sin recargar | Ver aserciones del spec | RF-14 | R5 | Pasa (ronda 9) |
| E2E-25 | Cypress (`07-notificaciones.cy.ts`) | F | PE | Un gasto nuevo en mi grupo marca el pago pendiente al instante | Ver aserciones del spec | RF-14, UX-06 | R5 | Pasa (ronda 9) |

## 6. Cuentas por ítems y con personas sueltas

| ID | Nivel / herramienta | Tipo | Técnica | Descripción | Resultado esperado | Req. | Agregado | Última ejecución |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| UT-09 | Vitest (`bill.test.ts`) | N | EG | Validaciones de la división por ítems | Rechaza unidades sin asignar, de más o a no participantes; línea compartida se divide | RF-15 | R6 | Pasa (ronda 9) |
| API-67 | Newman | F | PE | Cuenta dividida por ítems | 201; Total 60 (suma de ítems); A paga 25 y B 35; Guarda las líneas con sus asignaciones | RF-15 | R6 | Pasa (ronda 9) |
| API-68 | Newman | N | PE | Ítems con unidades sin asignar | 400; ITEMS_UNASSIGNED; Dice cuántas faltan | RF-15 | R6 | Pasa (ronda 9) |
| API-69 | Newman | N | PE | Total distinto a la suma de los ítems | 400; TOTAL_MISMATCH | RF-15 | R6 | Pasa (ronda 9) |
| API-70 | Newman | L | VL | Ítem con cantidad 0 | 400; VALIDATION_ERROR | RF-15 | R6 | Pasa (ronda 9) |
| API-71 | Newman | N | PE | Cuenta sin ítems ni monto | 400; MISSING_TOTAL | RF-15 | R6 | Pasa (ronda 9) |
| API-72 | Newman | F | PE | Cuenta rápida sin grupo previo | 201; Cada uno paga 20 | RF-15 | R6 | Pasa (ronda 9) |
| API-73 | Newman | F | PE | La cuenta rápida aparece marcada en mis grupos | 200; isQuick = true | RF-15 | R6 | Pasa (ronda 9) |
| E2E-08 | Cypress (`02-grupos-gastos.cy.ts`) | N | PE | No permite guardar una división por ítems con unidades sin asignar | Ver aserciones del spec | RF-15, RNF-03 | R1 | Pasa (ronda 9) · falló en la ronda 1 |
| E2E-26 | Cypress (`08-cuentas-y-pagos.cy.ts`) | F | PE | Almuerzo del sábado dividido por ítems: 30 / 35 / 20 | Ver aserciones del spec | RF-15 | R7 | Pasa (ronda 9) |
| E2E-27 | Cypress (`08-cuentas-y-pagos.cy.ts`) | F | PE | Cuenta con personas sueltas (sin grupo) y un ítem compartido | Ver aserciones del spec | RF-15, UX-02 | R7 | Pasa (ronda 9) |

## 7. Datos bancarios y pagos

| ID | Nivel / herramienta | Tipo | Técnica | Descripción | Resultado esperado | Req. | Agregado | Última ejecución |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| UT-07 | Vitest (`balances.test.ts`) | F | PE | Pagos confirmados en el balance | Pago total deja a ambos en 0; pago parcial reduce la deuda | RF-16 | R6 | Pasa (ronda 9) |
| API-74 | Newman | F | PE | A registra su cuenta bancaria | 201; Visible por defecto | RF-16 | R6 | Pasa (ronda 9) |
| API-75 | Newman | N | PE | Banco fuera de la lista | 400; VALIDATION_ERROR | RF-16 | R6 | Pasa (ronda 9) |
| API-76 | Newman | F | PE | A prefiere transferencia | 200 | RF-16 | R6 | Pasa (ronda 9) |
| API-77 | Newman | F | PE | B (comparte grupo) ve los datos de pago de A | 200; Preferencia y cuenta visibles | RF-16 | R6 | Pasa (ronda 9) |
| API-78 | Newman | F | TD | Registro de un usuario sin relación con A | 201 | RF-16 | R6 | Pasa (ronda 9) |
| API-79 | Newman | F | TD | A hace privada su cuenta | 200 | RF-16 | R6 | Pasa (ronda 9) |
| API-80 | Newman | N | PE | Pagar más de lo que se debe | 400; AMOUNT_EXCEEDS_DEBT | RF-16 | R6 | Pasa (ronda 9) |
| API-81 | Newman | F | PE | B registra un pago de 20 a A | 201; Queda pendiente | RF-16 | R6 | Pasa (ronda 9) |
| API-82 | Newman | F | TE | A tiene un pago por confirmar | 200; paymentsToConfirm = 1 | RF-16 | R6 | Pasa (ronda 9) |
| API-83 | Newman | F | TE | Balance de B antes de confirmar | 200 | RF-16 | R6 | Pasa (ronda 9) |
| API-84 | Newman | F | TE | A confirma que recibió el monto completo | 200; Confirmado | RF-16 | R6 | Pasa (ronda 9) |
| API-85 | Newman | F | TE | El pago confirmado reduce la deuda de B | 200; La deuda baja exactamente 20 | RF-16 | R6 | Pasa (ronda 9) |
| API-86 | Newman | N | TE | No se puede confirmar dos veces | 409; PAYMENT_CLOSED | RF-16 | R6 | Pasa (ronda 9) |
| E2E-28 | Cypress (`08-cuentas-y-pagos.cy.ts`) | F | PE | El usuario registra su cuenta bancaria y su preferencia en el perfil | Ver aserciones del spec | RF-16 | R7 | Pasa (ronda 9) |
| E2E-29 | Cypress (`08-cuentas-y-pagos.cy.ts`) | F | TE | Quien debe registra el pago con comprobante y quien recibe lo confirma | Ver aserciones del spec | RF-16, UX-07, UX-09 | R7 | Pasa (ronda 9) |

## 8. Experiencia de usuario: propina, montos exactos, deudas y recordatorios

| ID | Nivel / herramienta | Tipo | Técnica | Descripción | Resultado esperado | Req. | Agregado | Última ejecución |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| UT-11 | Vitest (`bill.test.ts`) | F | PE | Propina proporcional (UX-05) | 120 + 10 % entre 4 → 33 c/u; proporcional 55/33/22; suma exacta; rechaza −1, 31 y 10.5 | UX-05 | R8 | Pasa (ronda 9) |
| UT-12 | Vitest (`money.test.ts`) | F | VL | Reparto proporcional por mayor residuo | 1000 con pesos 5/3/2 → 500/300/200; 100 entre 3 iguales → 34/33/33 | UX-05 | R8 | Pasa (ronda 9) |
| UT-13 | Vitest (`debts.test.ts`) | F | PE | Deudas por persona (UX-06) | Acreedor y deudor ven la misma deuda; pago confirmado la salda; varios grupos ordenados; ajeno sin deudas | RF-17, UX-06 | R8 | Pasa (ronda 9) |
| UT-14 | Vitest (`debts.test.ts`) | L | VL | Ventana de 24 h de los recordatorios (UX-08) | Sin previo → permitido; a la 1 h → bloqueado; a las 24 h + 1 ms → permitido | UX-08 | R8 | Pasa (ronda 9) |
| API-87 | Newman | F | PE | Crear grupo para deudas (A con B) | 201 | RF-17 | R8 | Pasa (ronda 9) |
| API-88 | Newman | F | PE | Gasto de 100 con propina del 10 % | 201; Total 110 con propina 10; A cada quien 55 | UX-05, RF-08 | R8 | Pasa (ronda 9) |
| API-89 | Newman | L | VL | Propina mayor a 30 % (valor límite) | 400; VALIDATION_ERROR | UX-05 | R8 | Pasa (ronda 9) |
| API-90 | Newman | L | VL | Propina con decimales | 400; VALIDATION_ERROR | UX-05 | R8 | Pasa (ronda 9) |
| API-91 | Newman | N | PE | Montos exactos que no suman el total | 400; SPLIT_MISMATCH | UX-04 | R8 | Pasa (ronda 9) |
| API-92 | Newman | F | PE | GET /debts del acreedor: B le debe 55 | 200; B debe 55 y se puede recordar; Sin datos sensibles del usuario | RF-17, UX-06 | R8 | Pasa (ronda 9) |
| API-93 | Newman | F | PE | GET /debts del deudor: le debe 55 a A | 200; Debe 55 a A | RF-17, UX-06 | R8 | Pasa (ronda 9) |
| API-94 | Newman | F | TE | El acreedor recuerda a B | 201; Indica cuándo se puede volver a recordar (24 h) | RF-17, UX-08 | R8 | Pasa (ronda 9) |
| API-95 | Newman | F | TE | GET /debts refleja el recordatorio enviado | 200; canRemindAt con fecha | RF-17, UX-08 | R8 | Pasa (ronda 9) |
| E2E-30 | Cypress (`02-grupos-gastos.cy.ts`) | F | PE | Montos exactos: no deja guardar si no cuadra y guarda cuando cuadra | Ver aserciones del spec | UX-04, UX-07 | R8 | Pasa (ronda 9) |
| E2E-31 | Cypress (`02-grupos-gastos.cy.ts`) | F | PE | Propina del 10 % repartida y visible en el detalle | Ver aserciones del spec | UX-05, UX-01 | R8 | Pasa (ronda 9) |
| E2E-33 | Cypress (`07-notificaciones.cy.ts`) | F | TE | El acreedor recuerda desde Inicio y el botón queda como 'Recordado' | Ver aserciones del spec | UX-06, UX-08 | R8 | Pasa (ronda 9) |
| E2E-34 | Cypress (`05-actividad-perfil.cy.ts`) | F | PE | 'Cómo funciona Evenly' en Perfil abre la guía y se puede recorrer hasta el final (DEF-006) | Ver aserciones del spec | UX-10, RNF-03 | R8b | Pasa (ronda 9) |

## 9. Seguridad

| ID | Nivel / herramienta | Tipo | Técnica | Descripción | Resultado esperado | Req. | Agregado | Última ejecución |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SEC-01 | Newman | S | EG | Login con inyección SQL en el correo | 400; No hay token; La respuesta no expone hash, stack ni SQL | RNF-04 | R1 | Pasa (ronda 9) |
| SEC-02 | Newman | S | EG | Perfil con token manipulado | 401; UNAUTHORIZED | RNF-05, RF-03 | R1 | Pasa (ronda 9) |
| SEC-03 | Newman | S | EG | Búsqueda con inyección SQL | 200; No devuelve toda la tabla de usuarios; La respuesta no expone hash, stack ni SQL | RNF-04 | R1 | Pasa (ronda 9) |
| SEC-04 | Newman | S | TD | Usuario ajeno intenta ver el grupo | 404; NOT_FOUND; No filtra datos del grupo | RNF-05 | R1 | Pasa (ronda 9) |
| SEC-05 | Newman | S | TD | Usuario ajeno intenta editar el grupo | 404; NOT_FOUND | RNF-05 | R1 | Pasa (ronda 9) |
| SEC-06 | Newman | S | TD | Integrante no admin intenta editar el grupo | 403; FORBIDDEN | RNF-05 | R1 | Pasa (ronda 9) |
| SEC-07 | Newman | S | EG | Inyección en el monto | 400; VALIDATION_ERROR; La respuesta no expone hash, stack ni SQL | RNF-04 | R1 | Pasa (ronda 9) |
| SEC-08 | Newman | S | TD | Usuario ajeno intenta registrar un gasto | 404; NOT_FOUND | RNF-05 | R1 | Pasa (ronda 9) |
| SEC-09 | Newman | S | TD | Usuario ajeno intenta listar los gastos | 404; No filtra montos | RNF-05 | R1 | Pasa (ronda 9) |
| SEC-10 | Newman | S | TD | Integrante sin permiso intenta borrar un gasto | 403; FORBIDDEN | RNF-05 | R1 | Pasa (ronda 9) |
| SEC-11 | Newman | S | EG | JSON mal formado | 400; INVALID_JSON; La respuesta no expone hash, stack ni SQL | RNF-02, RNF-04 | R1 | Pasa (ronda 9) |
| SEC-12 | Newman | S | VL | Cuerpo mayor a 100 KB | 413; PAYLOAD_TOO_LARGE | RNF-04 | R1 | Pasa (ronda 9) |
| SEC-13 | Newman | S | PE | Cabeceras de seguridad | 200; No expone X-Powered-By; X-Content-Type-Options: nosniff | RNF-06 | R1 | Pasa (ronda 9) |
| SEC-14 | Newman | S | EG | Búsqueda con comodines LIKE (enumeración de usuarios) | 200; Los comodines se tratan como texto literal (DEF-002) | RNF-04, RNF-06 | R1 | Pasa (ronda 9) · falló en la ronda 1 |
| SEC-15 | Script | S | VL | Fuerza bruta: límite de intentos de login | 52 logins fallidos: 1–50 → 401; desde el 51 → 429 | RNF-04 | R1 | Pasa (1 ejecución, `sec-rate-limit.txt`) |
| SEC-16 | Script SQL | S | EG | Contraseñas guardadas con bcrypt | 100 % con hash `$2b$10$` de 60 caracteres; ninguna en texto plano | RNF-06 | R1 | Pasa (1 ejecución, `sec-hash-contrasenas.txt`) |
| SEC-17 | Revisión del log | S | EG | El log del servidor no guarda datos sensibles | Solo método, ruta, estado y duración | RNF-06 | R1 | Pasa (1 ejecución, `sec-log-servidor.txt`) |
| SEC-18 | Newman | S | TE | Un tercero intenta aceptar una solicitud ajena | 404 | RNF-05, RF-12 | R4 | Pasa (ronda 9) |
| SEC-19 | Newman | S | TE | Quien envió intenta aceptar su propia solicitud | 403; FORBIDDEN | RNF-05, RF-12 | R4 | Pasa (ronda 9) |
| SEC-20 | Newman | S | TD | Un no integrante no puede obtener el enlace | 404 | RNF-05, RF-13 | R4 | Pasa (ronda 9) |
| SEC-21 | Newman | S | TE | Un integrante no admin intenta regenerar el enlace | 403 | RNF-05, RF-13 | R4 | Pasa (ronda 9) |
| SEC-22 | Newman | S | TE | El enlace anterior deja de funcionar | 404 | RNF-05, RF-13 | R4 | Pasa (ronda 9) |
| SEC-23 | Newman | S | EG | Código de invitación con inyección | 404; La respuesta no expone hash, stack ni SQL | RNF-04, RF-13 | R4 | Pasa (ronda 9) |
| SEC-24 | Newman | S | TD | Stream de notificaciones sin sesión | 401; UNAUTHORIZED | RNF-05, RF-14 | R5 | Pasa (ronda 9) |
| SEC-25 | Newman | S | EG | Cuenta rápida con un usuario inexistente | 400; USER_NOT_FOUND | RNF-04, RF-15 | R6 | Pasa (ronda 9) |
| SEC-26 | Newman | S | EG | Número de cuenta con texto malicioso | 400; VALIDATION_ERROR | RNF-04, RF-16 | R6 | Pasa (ronda 9) |
| SEC-27 | Newman | S | PE | Un usuario sin grupo ni amistad no ve los datos bancarios | 404; No filtra el número | RNF-06, RF-16 | R6 | Pasa (ronda 9) |
| SEC-28 | Newman | S | TD | Una cuenta privada no se muestra a otros | 200; Sin cuentas visibles | RNF-06, RF-16 | R6 | Pasa (ronda 9) |
| SEC-29 | Newman | S | PE | Comprobante que no es imagen | 400; INVALID_EVIDENCE | RNF-04, RF-16 | R6 | Pasa (ronda 9) |
| SEC-30 | Newman | S | TE | Quien pagó intenta confirmar su propio pago | 403; FORBIDDEN | RNF-05, RF-16 | R6 | Pasa (ronda 9) |
| SEC-31 | Newman | S | TD | Un tercero intenta ver el comprobante | 403 | RNF-05, RF-16 | R6 | Pasa (ronda 9) |
| SEC-32 | Newman | S | TD | GET /debts sin token | 401; UNAUTHORIZED | RNF-05, RF-17 | R8 | Pasa (ronda 9) |
| SEC-33 | Newman | S | PE | El deudor intenta 'recordarle' al acreedor | 400; NO_DEBT | RNF-05, RF-17 | R8 | Pasa (ronda 9) |
| SEC-34 | Newman | S | TD | Usuario ajeno envía recordatorio en un grupo que no es suyo | 404 | RNF-05, RF-17 | R8 | Pasa (ronda 9) |
| SEC-35 | Newman | S | EG | Recordatorio con campos extra o id inválido | 400; VALIDATION_ERROR | RNF-04, RF-17 | R8 | Pasa (ronda 9) |
| SEC-36 | Newman | S | TE | Segundo recordatorio antes de 24 h (anti-spam) | 429; REMINDER_TOO_SOON | RNF-04, UX-08 | R8 | Pasa (ronda 9) |
| SEC-37 | Playwright (`seguridad-prod/sec-37-cabeceras.spec.ts`) | S | EG | Cabeceras de seguridad del frontend en producción (DEF-008) | CSP, frame-ancestors / X-Frame-Options, X-Content-Type-Options, Referrer-Policy y Permissions-Policy presentes | RNF-06 | R9 | Pendiente: se ejecuta en producción después del despliegue |
| E2E-09 | Cypress (`02-grupos-gastos.cy.ts`) | S | EG | Limpia caracteres no numéricos del precio (entrada maliciosa) | Ver aserciones del spec | RNF-04 | R1 | Pasa (ronda 9) |
| E2E-10 | Cypress (`03-seguridad.cy.ts`) | S | EG | Un usuario no puede abrir el grupo de otro cambiando la URL | Ver aserciones del spec | RNF-05 | R1 | Pasa (ronda 9) |
| E2E-32 | Cypress (`07-notificaciones.cy.ts`) | S | EG | Recordatorio de cobro: llega al deudor y no se puede repetir en 24 h | Ver aserciones del spec | RF-17, UX-08 | R8 | Pasa (ronda 9) |

## 10. No funcionales

| ID | Nivel / herramienta | Tipo | Técnica | Descripción | Resultado esperado | Req. | Agregado | Última ejecución |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| API-01 | Newman | F | PE | Health check con base de datos | 200; Servicio y BD disponibles | RNF-01 | R1 | Pasa (ronda 9) |
| API-36 | Newman | N | EG | Ruta inexistente | 404; NOT_FOUND | RNF-02 | R1 | Pasa (ronda 9) |
| RNF-01 | Newman (colección) | NF | — | Rendimiento: cada respuesta de la API < 3 s | Aserción en todas las peticiones de Newman | RNF-01 | R1 | Pasa (ronda 9: promedio 320 ms, máx. 1428 ms) |
| RNF-02 | Newman (colección) | NF | — | Formato de error consistente | Toda respuesta ≥ 400 trae `error.code` y `error.message` | RNF-02 | R1 | Pasa (ronda 9) |
| PERF-01 | autocannon (`backend/load/carga.mjs`) | NF | VL | Prueba de carga: 20 usuarios concurrentes durante 30 s (GET /groups, /debts, /groups/:id, /health) | p97.5 < 3 s y 0 % de errores | RNF-01 | R9 | Pasa (ronda 9: 580 peticiones, p97.5 1562 ms, 0 errores) |
| CMP-01 | Playwright (`compat/cmp-01-flujo-principal.spec.ts`) | NF | PE | Compatibilidad: login, gasto con propina y pagar desde Inicio en Chromium, Firefox, WebKit, Pixel 5 e iPhone 13 | Las 3 pruebas pasan en los 5 proyectos | RNF-07 | R9 | Pasa (ronda 9: 15/15) |
| ACC-01 | Playwright + axe-core, Lighthouse | NF | EG | Accesibilidad: axe-core (WCAG 2.1 AA) y Lighthouse móvil en Login, Inicio, grupo y formulario de gasto | 0 violaciones graves de axe; Lighthouse Accesibilidad ≥ 90 | RNF-08 | R9 | Pasa (ronda 9b: axe 0 violaciones, Lighthouse 100 en las 4) · falló en la ronda 9 (DEF-009, DEF-010) |
| USA-01 | Observación + SUS | NF | — | Usabilidad con 5 compañeros: registrar un almuerzo, pagar, confirmar y recordar | ≥ 80 % de tareas sin ayuda; SUS promedio ≥ 70 | RNF-03, UX-NF-01 | — | Pendiente |

## Resumen

| Métrica | Valor |
| --- | --- |
| Casos documentados | 186 |
| Por nivel | Unitarias 14 · API 95 · Seguridad (API + scripts) 37 · E2E 34 · No funcionales y usabilidad 7 |
| Por tipo | F 87 · N 40 · L 13 · S 40 · NF 6 (F funcional, N negativo, L límite, S seguridad, NF no funcional) |
| Automatizados | 182 de 186 (97.8 %) |
| Ejecutados | 184 de 186 (98.9 %) |
| Aprobados en la última ejecución | 184 de 184 (100 %) |
| Pendientes | SEC-37, USA-01 |

Los casos E2E, API y unitarios que se agregaron en una ronda se vuelven a ejecutar en todas las rondas siguientes
(regresión completa). SEC-15, SEC-16 y SEC-17 se ejecutaron una vez con scripts porque verifican configuración que no
cambió desde entonces.
