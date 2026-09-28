# Registro de defectos — Evenly

**Ciclo:** Avance 2 · **Última actualización:** 2026-09-27

## Escalas

**Severidad** (impacto técnico)

| Nivel | Criterio |
| --- | --- |
| Crítica | Bloquea una funcionalidad principal y no hay forma de evitarlo |
| Alta | Falla de seguridad o pérdida o exposición de datos |
| Media | Resultado incorrecto que se puede evitar o que tiene impacto limitado |
| Baja | Cosmético o de redacción |

**Prioridad** (urgencia de corrección): Alta = antes de la siguiente entrega · Media = en este ciclo · Baja = cuando haya tiempo

**Estados:** Nuevo → Asignado → En corrección → Corregido → Verificado (regresión OK) → Cerrado · Reabierto si la regresión falla

## Resumen

| ID | Título | Severidad | Prioridad | Origen | Detectado por | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| DEF-001 | La división equitativa pierde centavos (100 / 3 = 99.99) | Media | Alta | Prototipo (`mockApi.ts`) | Revisión estática | Cerrado |
| DEF-002 | La búsqueda de usuarios con `%%` o `__` devuelve a todos los usuarios | Alta | Alta | Backend (`routes/users.ts`) | SEC-14 (Newman) | Cerrado |
| DEF-003 | "Agregar gasto" rechaza cualquier monto válido | Crítica | Alta | Frontend (`AddExpensePage.tsx`) | E2E-07 y E2E-08 (Cypress) | Cerrado |
| DEF-004 | Política de contraseña débil (4 caracteres) y distinta entre frontend y backend | Media | Media | Prototipo (`RegisterPage.tsx`, `mockApi.ts`) | Revisión estática | Cerrado |
| DEF-005 | La división por ítem acepta hasta 0.05 de diferencia con el total | Media | Media | Prototipo (`AddExpensePage.tsx`, `mockApi.ts`) | Revisión estática | Cerrado |

---

## DEF-001 — La división equitativa pierde centavos

| Campo | Valor |
| --- | --- |
| Severidad / Prioridad | Media / Alta |
| Componente | Cálculo de gastos (prototipo `frontend/src/lib/mockApi.ts`, función `equalSplit`) |
| Versión | Commit `9bd694a` (prototipo con mock-store) |
| Detectado | 2026-09-27, revisión estática del prototipo durante la migración al backend real |
| Requisito | RF-08, RF-10 |

**Pasos para reproducir (en el prototipo)**

1. Iniciar sesión con `paul@evenly.app`.
2. Abrir un grupo de 3 integrantes y "Agregar gasto".
3. Monto `100`, división "Equitativo" entre los 3 → Guardar.

**Resultado esperado:** las partes suman 100.00 (por ejemplo, 33.34 + 33.33 + 33.33).
**Resultado obtenido:** cada parte se redondea a 33.33 y la suma es 99.99. El mock lo aceptaba porque toleraba ±0.05, así que el centavo que falta desaparece de los balances.

**Causa raíz:** `Math.round(amount / n * 100) / 100` aplicado a cada participante, sin repartir el residuo.

**Corrección:** el backend calcula el reparto en centavos enteros y asigna los centavos sobrantes uno a uno (`backend/src/lib/money.ts → splitEqually`). El frontend ya no envía montos en la división equitativa. Los montos se guardan como `Int` en centavos (`montoCentavos`).

**Regresión:** UT-03 y API-20 — **Pasan** (2026-09-27).

---

## DEF-002 — Enumeración de usuarios con comodines LIKE en la búsqueda

| Campo | Valor |
| --- | --- |
| Severidad / Prioridad | Alta / Alta (exposición de datos personales: nombres y correos) |
| Componente | `GET /users?search=` (`backend/src/routes/users.ts`) |
| Versión | `develop`, versión inicial del backend (antes del commit del Avance 2) |
| Detectado | 2026-09-27, prueba exploratoria de seguridad; se automatizó como SEC-14 y falló en la ronda 1 |
| Requisito | RNF-04, RNF-06 |

**Pasos para reproducir**

1. Iniciar sesión con cualquier usuario y obtener un token.
2. `GET /users?search=%25%25` (es decir, `%%`) o `GET /users?search=__`.

**Resultado esperado:** los caracteres `%` y `_` se buscan como texto literal, así que la lista viene vacía (ningún nombre o correo los contiene).
**Resultado obtenido:** 200 con los 10 primeros usuarios del sistema (nombre y correo). Cambiando el patrón (`a%`, `b%`…) se puede recorrer toda la tabla de usuarios.

**Evidencia:** `evidencias/newman-ronda1-antes-de-corregir.txt` — "AssertionError: expected [...] to have a length of +0 but got 10".

**Causa raíz:** el filtro `contains` de Prisma se traduce a `ILIKE '%texto%'`. El valor va parametrizado, así que no hay inyección SQL, pero los comodines de LIKE que escribe el usuario no se escapan.

**Corrección:** se escapan `\`, `%` y `_` antes de consultar (`search.replace(/[\\%_]/g, "\\$&")`).

**Regresión:** SEC-14, SEC-03 y API-15 — **Pasan** (`evidencias/newman-ronda2-regresion.txt`). La búsqueda normal sigue funcionando: `ana` devuelve 2 usuarios.

---

## DEF-003 — "Agregar gasto" rechaza cualquier monto válido

| Campo | Valor |
| --- | --- |
| Severidad / Prioridad | Crítica / Alta (no se puede registrar ningún gasto desde la interfaz) |
| Componente | `frontend/src/pages/groups/AddExpensePage.tsx` (constante `AMOUNT_PATTERN`) |
| Versión | `develop`, migración del frontend a la API real (antes del commit del Avance 2) |
| Detectado | 2026-09-27, Cypress E2E-07 y E2E-08 fallaron en la ronda 1 |
| Requisito | RF-08 |

**Pasos para reproducir**

1. Iniciar sesión, abrir un grupo y pulsar "Agregar gasto".
2. Monto `90`, descripción `Pizza`, división "Equitativo".
3. Pulsar "Agregar gasto".

**Resultado esperado:** se guarda el gasto y se vuelve al detalle del grupo.
**Resultado obtenido:** el formulario muestra "El monto debe ser mayor a 0." y no envía nada.

**Evidencia:** `evidencias/cypress-ronda1.txt` y las capturas en `evidencias/cypress-ronda1-screenshots/`.

**Causa raíz:** al generar el archivo con un script se perdieron las barras invertidas de la expresión regular: quedó `/^d+(.d{1,2})?$/` (una "d" literal) en lugar de `/^\d+(\.\d{1,2})?$/`. El build y el lint no lo detectan porque la sintaxis sigue siendo válida.

**Corrección:** se restauró la expresión regular correcta. Se revisó el resto de los archivos modificados buscando el mismo patrón y no apareció en ningún otro.

**Regresión:** E2E-07 y E2E-08 — **Pasan** (`evidencias/cypress-ronda2-regresion.txt`). El resto de la suite E2E también pasa (10/10).

**Lección aprendida:** una regla de validación en el cliente puede romper un flujo completo sin que el compilador lo note. La prueba E2E del flujo feliz fue lo que lo detectó.

---

## DEF-004 — Política de contraseña débil e inconsistente

| Campo | Valor |
| --- | --- |
| Severidad / Prioridad | Media / Media |
| Componente | `RegisterPage.tsx`, `LoginPage.tsx`, prototipo `mockApi.ts` |
| Versión | Commit `9bd694a` |
| Detectado | 2026-09-27, revisión estática |
| Requisito | RF-01, RNF-06 |

**Pasos para reproducir (en el prototipo):** registrarse con la contraseña `1234` → se acepta.

**Resultado esperado:** mínimo 8 caracteres, con al menos una letra y un número. La misma regla en el frontend y en el backend.
**Resultado obtenido:** se aceptaban 4 caracteres cualesquiera. El login también exigía 4 caracteres, lo que revela información sobre la política de contraseñas.

**Corrección:** el backend valida 8–72 caracteres con al menos una letra y un número (zod, `backend/src/lib/schemas.ts`); 72 es el límite de bcrypt. El registro en el frontend aplica la misma regla. El login solo exige que la contraseña no esté vacía.

**Regresión:** API-07 y E2E-02 — **Pasan**.

---

## DEF-005 — La división por ítem acepta diferencias de hasta 0.05

| Campo | Valor |
| --- | --- |
| Severidad / Prioridad | Media / Media |
| Componente | `AddExpensePage.tsx` (`Math.abs(remaining) > 0.05`), prototipo `mockApi.ts` |
| Versión | Commit `9bd694a` |
| Detectado | 2026-09-27, revisión estática |
| Requisito | RF-08, RF-10 |

**Pasos para reproducir (en el prototipo):** gasto de 50.00 "Por ítem" con 20.00 + 29.96 → se guarda.

**Resultado esperado:** se rechaza si las partes no suman exactamente el total.
**Resultado obtenido:** se guarda y los balances del grupo quedan descuadrados 0.04.

**Corrección:** el backend compara en centavos y exige igualdad exacta (400 `SPLIT_MISMATCH`). El frontend calcula el restante en centavos y solo deja guardar cuando es exactamente 0.

**Regresión:** API-22 (diferencia de 0.01) y E2E-08 — **Pasan**.

---

## Observaciones del entorno (no son defectos del producto)

| ID | Observación | Recomendación |
| --- | --- | --- |
| OBS-01 | En la máquina de desarrollo la variable `NODE_TLS_REJECT_UNAUTHORIZED=0` está definida a nivel de sistema, lo que desactiva la verificación de certificados TLS para todo Node.js. | Quitarla de las variables de entorno de Windows. No debe existir en Render. |
| OBS-02 | La cadena de conexión de Neon usa `sslmode=require`, y el driver `pg` avisa que ese modo va a cambiar de significado en su próxima versión. | Usar `sslmode=verify-full` en `DATABASE_URL`. |
| OBS-03 | Desde la terminal integrada de VS Code, Cypress falla con `bad option: --smoke-test` porque VS Code define `ELECTRON_RUN_AS_NODE=1`. | Correr Cypress desde una terminal externa o sin esa variable (ver `docs/README.md`). |
