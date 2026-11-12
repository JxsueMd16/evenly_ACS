# Registro de defectos — Evenly

**Ciclo:** Entrega final · **Última actualización:** 2026-11-11

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
| DEF-006 | "Ayuda y preguntas frecuentes" en Perfil no hace nada | Baja | Media | Frontend (`ProfilePage.tsx`) | Evaluación heurística de UX | Cerrado |
| DEF-007 | Los integrantes de cada grupo son ilegibles en "¿Con quién fue?" | Baja | Media | Frontend (`AddExpenseEntryPage.tsx`, código nuevo de UX) | Prueba exploratoria en móvil | Cerrado |
| DEF-008 | El frontend en producción no envía cabeceras de seguridad (CSP, anti-clickjacking, nosniff) | Media | Alta | Configuración de Vercel (`frontend/vercel.json`) | Revisión de cabeceras HTTP | Corregido (falta verificar en producción con SEC-37) |
| DEF-009 | Contraste de color insuficiente en textos secundarios, montos y barra de navegación | Media | Alta | Frontend (`index.css`, `BottomNav.tsx`) | ACC-01 (axe-core, automatizado) | Cerrado |
| DEF-010 | Nombres accesibles que no coinciden con el texto visible | Baja | Media | Frontend (`BottomNav.tsx`, `HomePage.tsx`, `GroupDetailPage.tsx`) | ACC-01 (axe-core, automatizado) | Cerrado |

### Defectos por ronda

| Ronda | Defectos nuevos | Comentario |
| --- | --- | --- |
| R1 | DEF-001 a DEF-005 | 2 por pruebas automatizadas (SEC-14, E2E-07/08) y 3 por revisión estática del prototipo |
| R2 a R7 | 0 | Las suites de cada ronda (social, notificaciones, cuentas por ítems y pagos) pasaron al primer intento; ver evidencias |
| R8 (UX) | DEF-006, DEF-007, DEF-008 | Encontrados con técnicas no automatizadas: evaluación heurística, exploratoria y revisión de cabeceras |
| R9 (no funcionales) | DEF-009, DEF-010 | Encontrados por la auditoría automática de accesibilidad (ACC-01); corregidos y verificados en R9b |

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

## DEF-006 — "Ayuda y preguntas frecuentes" en Perfil no hace nada

| Campo | Valor |
| --- | --- |
| Severidad / Prioridad | Baja / Media (no bloquea nada, pero el usuario que busca ayuda no la encuentra) |
| Componente | `frontend/src/pages/ProfilePage.tsx` |
| Versión | `main` en el commit `66d329f` (versión del Avance 2) |
| Detectado | 2026-11-11, evaluación heurística de UX (heurística de Nielsen n.º 10, "Ayuda y documentación") |
| Requisito | RNF-03, UX-10 |

**Pasos para reproducir**

1. Iniciar sesión e ir a Perfil.
2. Tocar "Ayuda y preguntas frecuentes".

**Resultado esperado:** se abre alguna forma de ayuda.
**Resultado obtenido:** no pasa nada. El botón no tenía `onClick`.

**Causa raíz:** el elemento se maquetó como marcador de posición y nunca se conectó a una pantalla.

**Corrección:** el botón se renombró a "Cómo funciona Evenly" y abre la guía de bienvenida (`WelcomeTour.tsx`), que
también se muestra al crear la cuenta (UX-10). Commit `c91fa22`.

**Regresión:** E2E-34 (abre la guía desde Perfil, la recorre y verifica que no reaparece al recargar) — **Pasa**
(`evidencias/cypress-ronda8b-regresion-def006.txt`). E2E-01 cubre la guía al registrarse.

---

## DEF-007 — Los integrantes de cada grupo son ilegibles en "¿Con quién fue?"

| Campo | Valor |
| --- | --- |
| Severidad / Prioridad | Baja / Media |
| Componente | `frontend/src/pages/groups/AddExpenseEntryPage.tsx` |
| Versión | Rama `feature/ux-mejoras` antes del merge (código nuevo de UX-02) |
| Detectado | 2026-11-11, prueba exploratoria en el navegador con viewport móvil (375 × 812) y la cuenta demo |
| Requisito | RNF-03, UX-02 |

**Pasos para reproducir**

1. Iniciar sesión con una cuenta que tenga grupos de 3 o más personas.
2. Tocar el botón "+".

**Resultado esperado:** en cada tarjeta de grupo se distingue con quién es el grupo.
**Resultado obtenido:** los avatares de 20 px con iniciales se encimaban y no se podían leer.

**Causa raíz:** se reutilizó la fila de avatares de Inicio con un tamaño menor sin comprobarla en pantalla.

**Corrección:** la tarjeta muestra los nombres de los demás integrantes ("Ana, Kevin") en texto. Se corrigió antes
del merge a `main`.

**Regresión:** E2E-27 (flujo con personas sueltas en la misma pantalla) — **Pasa**; revisión visual en móvil — **OK**.

**Lección aprendida:** las pruebas automatizadas verifican que los elementos existen, no que se puedan leer. La
revisión visual en el tamaño real del dispositivo sigue siendo necesaria.

---

## DEF-008 — El frontend en producción no envía cabeceras de seguridad

| Campo | Valor |
| --- | --- |
| Severidad / Prioridad | Media / Alta (no hay explotación directa, pero sin CSP un XSS podría leer el token de sesión guardado en `localStorage`, y la página se puede incrustar en otro sitio) |
| Componente | `frontend/vercel.json` (configuración del hosting) |
| Versión | Producción `https://evenly-acs.vercel.app` (commit `504f26e`) |
| Detectado | 2026-11-11, revisión de cabeceras HTTP con `curl -I` |
| Requisito | RNF-06 |

**Pasos para reproducir**

1. `curl -I https://evenly-acs.vercel.app/login`

**Resultado esperado:** como en la API (que usa helmet): `Content-Security-Policy`, `X-Frame-Options` o
`frame-ancestors`, `X-Content-Type-Options: nosniff`, `Referrer-Policy` y `Permissions-Policy`.
**Resultado obtenido:** solo `Strict-Transport-Security`, que Vercel agrega por defecto.

**Causa raíz:** `vercel.json` solo define la reescritura de rutas de la SPA; no tiene un bloque `headers`.

**Corrección (ronda 9):** bloque `headers` en `frontend/vercel.json` con:

- `Content-Security-Policy`: `default-src 'self'`, scripts solo propios, `connect-src` limitado al propio sitio y a la
  API de Render (se verificó que el build de producción usa exactamente esa URL), `frame-ancestors 'none'`,
  `object-src 'none'`, `base-uri` y `form-action` propios. Imágenes `data:`/`blob:` para la vista previa del comprobante.
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy` (sin cámara, micrófono, ubicación ni pagos) y `Cross-Origin-Opener-Policy: same-origin`.

**Regresión:** SEC-37 (Playwright, proyecto `seguridad-prod`) revisa las cabeceras en `/login`, `/` y una ruta
interna, y que la app cargue sin violaciones de la CSP. Se ejecuta contra producción después de desplegar:
`pnpm pw:prod`. Estado: **pendiente de despliegue**.

---

## DEF-009 — Contraste de color insuficiente

| Campo | Valor |
| --- | --- |
| Severidad / Prioridad | Media / Alta (texto difícil de leer para personas con baja visión o bajo el sol; incumple WCAG 2.1 AA 1.4.3) |
| Componente | Tokens de color en `frontend/src/index.css`; etiquetas de `BottomNav.tsx` |
| Versión | Rama `qa/ronda-9` antes de la corrección (igual a producción `504f26e`) |
| Detectado | 2026-11-12, ACC-01 (axe-core en Playwright) falló en las 4 pantallas auditadas |
| Requisito | RNF-08 |

**Pasos para reproducir:** `pnpm exec playwright test --project=chromium playwright/tests/accesibilidad`.

**Resultado esperado:** relación de contraste ≥ 4.5:1 para texto normal.
**Resultado obtenido (axe):**

| Elemento | Color | Fondo | Contraste |
| --- | --- | --- | --- |
| Texto secundario (`muted-foreground`): etiquetas, fechas, "tu parte" | `#64809c` | blanco / pastel | 3.65 – 4.11 |
| Montos en rojo ("debes", "Le debes") | `#ef4444` | blanco | 3.76 |
| Montos en verde ("te deben") | `#10b981` | blanco | 2.53 |
| Etiquetas de la barra inferior (Inicio, Grupos…) | `#72aec5` | blanco | 2.44 |
| Iniciales del avatar celeste | `#14789f` | `#e3f4fd` | 4.41 |

**Causa raíz:** la paleta se eligió por estética (tonos pastel claros) sin verificar contraste.

**Corrección:** `muted-foreground` `#4d6985` (5.0 – 5.7:1), `destructive` `#c62828` (5.6:1), `success` `#047857`
(5.5:1), `sky-foreground` `#0f6a8c` (5.4:1) y la barra inferior usa `muted-foreground`. En modo oscuro se definieron
rojo y verde claros propios para no perder contraste sobre fondo oscuro.

**Regresión:** ACC-01 — axe 0 violaciones en las 4 pantallas y Lighthouse Accesibilidad 100
(`evidencias/playwright-ronda9-compat-a11y.txt`, `evidencias/lighthouse-ronda9/`). CMP-01 (15/15) y la suite E2E
(34/34) siguen pasando.

---

## DEF-010 — Nombres accesibles que no coinciden con el texto visible

| Campo | Valor |
| --- | --- |
| Severidad / Prioridad | Baja / Media (afecta a quien usa control por voz: dice lo que ve y el botón no responde; WCAG 2.1 2.5.3) |
| Componente | `BottomNav.tsx` (contadores), `HomePage.tsx` (avatar → Perfil), `GroupDetailPage.tsx` (tarjetas de cuentas) |
| Versión | Rama `qa/ronda-9` antes de la corrección |
| Detectado | 2026-11-12, ACC-01 (axe-core, regla `label-content-name-mismatch`) |
| Requisito | RNF-08 |

**Resultado obtenido:** el `aria-label` reemplazaba el texto visible. Por ejemplo, el avatar mostraba "PW" pero se
llamaba "Perfil"; la tarjeta de una cuenta mostraba descripción, monto y fecha pero se llamaba solo "Ver cuenta X".

**Corrección:** el nombre accesible sale del texto visible, y la información extra se agrega con texto solo para
lectores de pantalla (`sr-only`): ", debes en 1 grupo" en la barra, "Perfil" junto al avatar (marcado `aria-hidden`) y
"Ver cuenta" al inicio de cada tarjeta. Las pruebas de Cypress que usaban esos `aria-label` se actualizaron.

**Regresión:** ACC-01 — 0 violaciones; E2E-14, E2E-24, E2E-26 y E2E-31 — **Pasan** (`evidencias/cypress-ronda9-regresion.txt`).

---

## Observaciones del entorno (no son defectos del producto)

| ID | Observación | Recomendación |
| --- | --- | --- |
| OBS-01 | En la máquina de desarrollo la variable `NODE_TLS_REJECT_UNAUTHORIZED=0` está definida a nivel de sistema, lo que desactiva la verificación de certificados TLS para todo Node.js. | Quitarla de las variables de entorno de Windows. No debe existir en Render. |
| OBS-02 | La cadena de conexión de Neon usa `sslmode=require`, y el driver `pg` avisa que ese modo va a cambiar de significado en su próxima versión. | Usar `sslmode=verify-full` en `DATABASE_URL`. |
| OBS-03 | Desde la terminal integrada de VS Code, Cypress falla con `bad option: --smoke-test` porque VS Code define `ELECTRON_RUN_AS_NODE=1`. | Correr Cypress desde una terminal externa o sin esa variable (ver `docs/README.md`). |
