# Requisitos de experiencia de usuario (UX) — Evenly

**Versión:** 1.0 (implementado) · **Fecha:** 2026-11-11 · **Rama:** `feature/ux-mejoras`

Requisitos definidos con el equipo a partir de la revisión de la app actual. Cada requisito tiene criterios de
aceptación verificables; los casos de prueba que los cubren se agregarán a `casos-de-prueba.md` y a
`matriz-trazabilidad.md` al implementarlos.

## Contexto de uso

| Aspecto | Definición |
| --- | --- |
| Usuario típico | Estudiantes universitarios |
| Uso principal | Dividir almuerzos y comidas entre compañeros (gastos pequeños, frecuentes, desde el celular) |
| Lo primero al abrir la app | Ver sus cuentas compartidas y, sobre todo, **cuánto debe y a quién** |
| Objetivo de diseño | Registrar un gasto simple con el **mínimo de pasos** posible |
| Moneda | Quetzales (Q) |

## Requisitos

### UX-01 — Quetzales por defecto

La moneda inicial de la app es el quetzal.

- [x] Un usuario nuevo ve todos los montos con el formato `Q 120.00` sin tocar Ajustes.
- [x] Quien ya eligió otra moneda en Ajustes conserva su elección.

### UX-02 — Un solo flujo para agregar gastos: "¿Con quién fue?"

Desaparece la elección entre "Cuenta rápida" y "En un grupo". El botón (+) abre una sola pantalla.

- [x] Arriba se muestran los grupos, ordenados por uso más reciente; tocar uno lleva directo al formulario.
- [x] Abajo se pueden marcar amigos o buscar personas sueltas; al continuar se crea la cuenta rápida por dentro.
- [x] En ningún texto de la pantalla aparece la palabra "cuenta rápida" ni "tipo de cuenta".
- [x] Si el usuario no tiene grupos ni amigos, la pantalla explica qué hacer y ofrece buscar personas o crear un grupo.

### UX-03 — Registro de un gasto simple en 4 toques

El formulario abre con valores por defecto que cubren el caso más común: "pagué yo, se divide en partes iguales
entre todos".

- [x] Por defecto: pagó el usuario actual, participan todos los integrantes, división en partes iguales.
- [x] El foco inicial está en el monto y el teclado es numérico.
- [x] El nombre es opcional: si queda vacío se guarda como "Almuerzo" (o la categoría elegida) con la fecha.
- [x] Flujo medido: (+) → grupo → monto → Guardar = **4 toques** y una escritura.
- [x] Ítems, quién pagó, participantes y forma de dividir siguen disponibles en una sección "Más opciones".

### UX-04 — División por montos exactos

Nueva forma de cobrar además de "Partes iguales" y "Por ítem": cada quien paga un monto escrito a mano.

- [x] Se puede escribir el monto de cada participante.
- [x] La app muestra en vivo cuánto falta o sobra para llegar al total ("Faltan Q 10.00").
- [x] No se puede guardar si la suma no coincide exactamente con el total (al centavo).
- [x] El backend rechaza con 400 una cuenta cuyos montos no suman el total (ya soportado como `itemized`).

### UX-05 — Propina / servicio

Opción para agregar el servicio del restaurante sin calcularlo a mano.

- [x] Botón "+ Propina" con 10 % sugerido y el porcentaje editable (0–30 %).
- [x] La propina se reparte proporcionalmente a lo que consumió cada quien (en partes iguales, queda igual para todos).
- [x] El resumen muestra subtotal, propina y total por separado, y el detalle de la cuenta conserva esa información.
- [x] Los centavos se reparten sin perder ni sobrar dinero (la suma de las partes es igual al total).

### UX-06 — Inicio: "Lo que debes"

La pantalla de inicio prioriza las deudas propias.

- [x] Debajo del balance total aparece la lista "Debes" con cada persona: "Ana · Q 30.00 · Universidad" y un botón **Pagar**.
- [x] También una lista "Te deben" con el botón **Recordar** (ver UX-08).
- [x] Si el usuario está al día, se muestra un mensaje positivo en lugar de las listas.

### UX-07 — Detalle del grupo: primero "tu situación"

- [x] Lo primero en el detalle del grupo es una tarjeta con la situación del usuario: "Le debes Q 30.00 a Ana" con **Pagar**, o "Kevin te debe Q 15.00" con **Recordar**, o "Estás a mano".
- [x] El balance de todos los integrantes y los pagos sugeridos entre terceros pasan a una sección secundaria.

### UX-08 — Recordatorios de cobro

- [x] Quien tiene saldo a favor puede tocar **Recordar** sobre una deuda.
- [x] El deudor recibe la notificación en tiempo real: "Paul te recuerda que le debes Q 30.00 (Universidad)".
- [x] Solo se permite **un recordatorio por deuda cada 24 horas**; el botón muestra cuándo se podrá volver a enviar (evita spam).
- [x] No se puede enviar un recordatorio a alguien que no debe nada al usuario, ni en un grupo ajeno (403/400).

### UX-09 — Confirmación de pagos (se mantiene)

El pago lo confirma quien lo recibe; se conserva el flujo actual.

- [x] Los pagos por confirmar aparecen en Inicio con acceso directo a Confirmar / No lo recibí.

### UX-10 — Bienvenida la primera vez

- [x] Al entrar por primera vez se muestran 3 pantallas: qué es Evenly, cómo agregar un gasto, cómo pagar y confirmar.
- [x] Se puede saltar en cualquier momento y no vuelve a aparecer.
- [x] Se puede volver a ver desde Perfil → Ayuda.

## Requisitos no funcionales asociados

### UX-NF-01 — Usabilidad medida (cierra USA-01)

- [ ] Prueba con al menos 5 compañeros con tareas guiadas (registrar un almuerzo, pagar una deuda, confirmar un pago, recordar un cobro).
- [ ] Cuestionario SUS: puntaje promedio **≥ 70**.
- [ ] Al menos el 80 % de las tareas completadas sin ayuda.

### UX-NF-02 — Accesibilidad

- [ ] Lighthouse (móvil) en Accesibilidad **≥ 90** en Inicio, detalle de grupo y formulario de gasto.
- [ ] Todos los botones de ícono tienen `aria-label`; áreas táctiles de al menos 44 × 44 px.

## Fuera de alcance

- División por porcentajes (decisión del equipo: poco uso en almuerzos).
- Inicio de sesión con Google.

## Estado y trazabilidad (ronda UX, 2026-11-11)

| Req. | Implementación | Casos de prueba | Resultado |
| --- | --- | --- | --- |
| UX-01 | `settingsStore.ts` (GTQ por defecto + migración), `utils.ts` (formato `Q 1,234.50`) | E2E-31, E2E-32 (montos en Q) | Pasa |
| UX-02 | `AddExpenseEntryPage.tsx` ("¿Con quién fue?"), `QuickBillPage.tsx`, `lastActivityAt` en `GET /groups` | E2E-27 | Pasa |
| UX-03 | `BillForm.tsx` (monto primero con foco, nombre opcional, "Cambiar" para quién pagó/participantes/categoría) | E2E-07 | Pasa |
| UX-04 | `BillForm.tsx` (Montos exactos, "Faltan / Sobran / Cuadra"), `computeBill` modo `itemized` | E2E-30, API-91, UT `bill.test.ts` | Pasa |
| UX-05 | `tipPercent` en API, `computeBill` + `splitProportionally`, columna `Gasto.propinaCentavos`, detalle con subtotal + propina | E2E-31, API-88, API-89, API-90, UT `bill.test.ts` y `money.test.ts` | Pasa |
| UX-06 | `GET /debts`, `lib/debts.ts`, `HomePage.tsx` (Debes / Te deben) | E2E-25, E2E-33, API-92, API-93, SEC-32, UT `debts.test.ts` | Pasa |
| UX-07 | `GroupDetailPage.tsx` ("Tu situación" primero, con Pagar / Recordar) | E2E-29, E2E-30 | Pasa |
| UX-08 | `POST /debts/remind`, tabla `RecordatorioCobro`, aviso en tiempo real `payment-reminder`, `RemindButton.tsx` | E2E-32, E2E-33, API-94, API-95, SEC-33, SEC-34, SEC-35, SEC-36, UT `debts.test.ts` | Pasa |
| UX-09 | Se conserva el flujo de confirmación; aviso en Inicio | E2E-29 | Pasa |
| UX-10 | `WelcomeTour.tsx` (al crear la cuenta y desde Perfil → Cómo funciona Evenly) | E2E-01 | Pasa |
| UX-NF-01 | — | USA-01 (pendiente: prueba con compañeros) | Pendiente |
| UX-NF-02 | — | Lighthouse (pendiente de medir) | Pendiente |

**Evidencia:** `evidencias/cypress-ronda7-ux.txt` (33/33), `evidencias/newman-ronda8-ux.txt` (128 peticiones, 453 aserciones, 0 fallas), `evidencias/vitest-unitarias-ronda-ux.txt` (50/50).

**Hallazgo durante la revisión:** el botón "Ayuda y preguntas frecuentes" de Perfil no hacía nada (candidato a registrar como defecto de usabilidad); ahora abre la guía.

## Orden de implementación propuesto

1. UX-01 (quetzales): cambio pequeño, efecto inmediato.
2. UX-02 + UX-03 (flujo único y registro en 4 toques): el cambio de mayor impacto.
3. UX-06 + UX-07 (lo que debes, en Inicio y en el grupo).
4. UX-04 + UX-05 (montos exactos y propina).
5. UX-08 (recordatorios): requiere endpoint nuevo en el backend.
6. UX-10 (bienvenida).
7. UX-NF-02 y UX-NF-01 (medición de accesibilidad y prueba de usabilidad al final).
