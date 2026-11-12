# Plan de pruebas — Evenly

**Proyecto Final — Aseguramiento de la Calidad del Software (UMG, código 048)**

| Campo | Valor |
| --- | --- |
| Documento | Plan de pruebas (basado en la estructura de IEEE 829 / ISO/IEC/IEEE 29119-3) |
| Versión | 1.0 |
| Fecha | 2026-11-11 |
| Sistema bajo prueba | Evenly — gestor de gastos compartidos para universitarios |
| Repositorio | `github.com/JxsueMd16/evenly_ACS` (ramas `main`, `develop`, `feature/*`) |
| Entorno de producción | Frontend `https://evenly-acs.vercel.app` · API `https://evenly-api-4b1b.onrender.com` |
| Equipo | 3 integrantes (ver sección 13) |

### Historial de versiones

| Versión | Fecha | Cambio |
| --- | --- | --- |
| 0.1 | 2026-09-27 | Estrategia inicial dentro de `docs/README.md` (Avance 2) |
| 1.0 | 2026-11-11 | Plan formal completo: alcance con todos los módulos, requisitos RF-12 a RF-17 y UX, criterios de entrada/salida, métricas y cronograma hasta el cierre |

---

## 1. Introducción y propósito

Este plan define **qué** se prueba en Evenly, **cómo**, **con qué herramientas**, **quién** y **cuándo**, y con qué
criterios se decide si el sistema está listo para producción. Es el documento de referencia para:

- los casos de prueba (`casos-de-prueba.md`),
- la matriz de trazabilidad (`matriz-trazabilidad.md`),
- el registro de defectos (`registro-defectos.md`),
- las pruebas de seguridad (`pruebas-seguridad.md`),
- las métricas (`metricas.md`) y el informe de cierre (Test Summary Report).

## 2. Descripción del sistema bajo prueba

Evenly permite a grupos de estudiantes registrar gastos compartidos (principalmente almuerzos), ver cuánto le debe
cada quien a quién, pagar esas deudas y confirmar los pagos.

| Capa | Tecnología | Notas |
| --- | --- | --- |
| Frontend | React 19 + Vite 8 + TypeScript, Tailwind, Zustand | Diseño para celular; desplegado en Vercel |
| API | Node.js 24 + Express 5 + TypeScript, validación con Zod | Desplegada en Render |
| Base de datos | PostgreSQL (Neon) con Prisma 7 | Migraciones versionadas en `backend/prisma/migrations` |
| Autenticación | JWT (HS256, 1 día) + bcrypt (cost 10) | Límite de intentos por IP en login y registro |
| Tiempo real | Server-Sent Events (`/notifications/stream`) | Avisos de gastos, pagos, amistades y recordatorios |
| CI/CD | GitHub Actions | Pruebas completas en cada push/PR a `main` y `develop`; despliegue solo desde `main` con todo en verde |

## 3. Alcance

### 3.1 Dentro del alcance

| Módulo | Requisitos |
| --- | --- |
| Registro, inicio y cierre de sesión, protección de rutas | RF-01, RF-02, RF-03 |
| Búsqueda de usuarios | RF-04 |
| Grupos: crear, ver, editar, eliminar, integrantes, salir | RF-05, RF-06, RF-07 |
| Gastos: registrar (partes iguales, por ítems, montos exactos, propina), listar, eliminar | RF-08, RF-09, RF-15, UX-04, UX-05 |
| Balances y pagos sugeridos | RF-10 |
| Actividad e historial de pagos | RF-11 |
| Amigos (solicitudes, aceptar, rechazar, eliminar) | RF-12 |
| Invitación a grupos por enlace | RF-13 |
| Notificaciones en tiempo real | RF-14 |
| Cuentas con personas sueltas (sin grupo) | RF-15 |
| Datos bancarios y pagos en dos pasos con comprobante | RF-16 |
| Deudas por persona y recordatorios de cobro | RF-17, UX-06, UX-08 |
| Experiencia de usuario (flujo de registro de gastos, Inicio, bienvenida, quetzales) | UX-01 a UX-10 |
| Requisitos no funcionales: rendimiento, manejo de errores, usabilidad, seguridad, compatibilidad, accesibilidad | RNF-01 a RNF-08 |

### 3.2 Fuera del alcance

| Elemento | Motivo |
| --- | --- |
| Pagos reales o integración bancaria | La app solo registra que se pagó fuera de ella (efectivo o transferencia) |
| Conversión de monedas | Solo cambia el símbolo mostrado (Q / USD) |
| Infraestructura de Vercel, Render y Neon | Servicios de terceros; se prueba solo su configuración (headers, CORS, variables) |
| Pruebas de penetración profundas (fuzzing masivo, DoS) | Fuera del tamaño del proyecto; se cubren los controles básicos de OWASP Top 10 |
| Escalado horizontal del tiempo real | El backend corre en una sola instancia (riesgo documentado en `pruebas-seguridad.md`) |
| Inicio de sesión con proveedores externos (Google) | Descartado por el equipo |

## 4. Objetivos de las pruebas

| # | Objetivo | Medida |
| --- | --- | --- |
| O-1 | Verificar que cada requisito funcional funciona según sus criterios de aceptación | 100 % de los requisitos con al menos un caso ejecutado y aprobado |
| O-2 | Detectar y corregir defectos antes del despliegue | 0 defectos críticos o altos abiertos al cierre |
| O-3 | Comprobar que las correcciones no rompen lo que ya funcionaba | Regresión automatizada completa después de cada corrección, con evidencia |
| O-4 | Demostrar al menos una medida real de ciberseguridad sobre los datos | Casos de validación de entradas, control de acceso y datos sensibles, todos aprobados |
| O-5 | Verificar atributos de calidad no funcionales | Tiempo de respuesta < 3 s; SUS ≥ 70; Lighthouse accesibilidad ≥ 90; funciona en Chromium, Firefox y WebKit |
| O-6 | Que cualquiera pueda volver a ejecutar las pruebas | Instrucciones en `docs/README.md` y ejecución automática en GitHub Actions |

## 5. Requisitos a probar

Los criterios de aceptación detallados de los requisitos RF-01 a RF-11 y RNF-01 a RNF-06 están en
`matriz-trazabilidad.md`; los de UX-01 a UX-10 en `requisitos-ux.md`. Este plan agrega los requisitos de los módulos
construidos después del Avance 2 (RF-12 a RF-17) y dos no funcionales (RNF-07 y RNF-08).

### 5.1 Funcionales

| ID | Requisito | Criterio de aceptación resumido |
| --- | --- | --- |
| RF-01 | Registrar una cuenta | Correo único, contraseña con la política de seguridad; nunca se devuelve el hash |
| RF-02 | Iniciar sesión (JWT) | Credenciales válidas → token; inválidas → 401 sin revelar si el correo existe |
| RF-03 | Sesión, rutas protegidas, cierre de sesión | Sin token o con token vencido → 401 y regreso al login |
| RF-04 | Buscar usuarios | Por nombre o correo, sin comodines que permitan listar a todos |
| RF-05 | Crear grupo con integrantes | El creador queda como administrador |
| RF-06 | Ver mis grupos y su detalle | Solo integrantes; un ajeno recibe 404 |
| RF-07 | Editar, eliminar, gestionar integrantes, salir | Solo el administrador edita/elimina/quita integrantes |
| RF-08 | Registrar un gasto | Partes iguales o por ítems; centavos sin pérdida |
| RF-09 | Listar y eliminar gastos | Elimina quien lo registró, quien pagó o el admin |
| RF-10 | Balances y pagos sugeridos | La suma de balances del grupo es 0; como máximo n − 1 pagos |
| RF-11 | Actividad e historial de pagos | Solo movimientos de los grupos propios |
| RF-12 | Amigos | Enviar, aceptar, rechazar y cancelar solicitudes; eliminar amistad; sin duplicados |
| RF-13 | Invitación por enlace | El enlace une al grupo; el admin puede regenerarlo e invalidar el anterior |
| RF-14 | Notificaciones en tiempo real | Contadores y avisos llegan sin recargar (SSE autenticado, sin token en la URL) |
| RF-15 | Cuentas por ítems y con personas sueltas | Ítems compartidos o por unidades; cuenta sin grupo previo |
| RF-16 | Datos bancarios y pagos en dos pasos | El deudor registra el pago (comprobante opcional ≤ 3 MB); solo cuenta al confirmarlo el acreedor |
| RF-17 | Deudas por persona y recordatorios | `GET /debts` coincide con los pagos sugeridos; un recordatorio por deuda cada 24 h |

### 5.2 Experiencia de usuario

UX-01 a UX-10 (quetzales, flujo único "¿Con quién fue?", gasto en 4 toques, montos exactos, propina, "Debes / Te
deben", "Tu situación", recordatorios, confirmación de pagos y bienvenida). Detalle en `requisitos-ux.md`.

### 5.3 No funcionales

| ID | Requisito | Criterio de aceptación |
| --- | --- | --- |
| RNF-01 | Rendimiento y disponibilidad | Cada respuesta de la API < 3 s en el entorno de prueba; `/health` verifica la base de datos; prueba de carga con 20 usuarios concurrentes con p95 < 3 s y 0 % de errores |
| RNF-02 | Manejo de errores consistente | Todo error con la forma `{ error: { code, message } }`, en español y sin detalles internos |
| RNF-03 | Usabilidad (= UX-NF-01) | 5 usuarios con tareas guiadas: ≥ 80 % sin ayuda y SUS promedio ≥ 70 |
| RNF-04 | Seguridad — validación de entradas | Rechazo de tipos, rangos y campos extra; sin inyección SQL ni LIKE; límite de tamaño e intentos |
| RNF-05 | Seguridad — control de acceso | Nadie ve ni modifica grupos, gastos, pagos o deudas ajenas; permisos por rol |
| RNF-06 | Seguridad — datos sensibles | bcrypt; sin hashes, contraseñas ni tokens en respuestas, logs o URLs; headers de seguridad en API y frontend |
| RNF-07 | Compatibilidad | Flujos principales correctos en Chromium, Firefox y WebKit, y en viewport móvil (390 × 844) |
| RNF-08 | Accesibilidad (= UX-NF-02) | Lighthouse móvil ≥ 90 en Inicio, detalle de grupo y formulario de gasto |

## 6. Estrategia de pruebas

### 6.1 Niveles

| Nivel | Qué valida | Herramienta | Ubicación | Prefijo |
| --- | --- | --- | --- | --- |
| Unitario | Reglas de negocio puras: dinero en centavos, repartos, propina, balances, deudas | Vitest | `backend/src/lib/*.test.ts` | `UT-` |
| Integración / API | Cada endpoint: flujo feliz, negativos, límites, permisos y formato de error | Postman/Apidog + Newman | `docs/api/evenly.postman_collection.json` | `API-`, `SEC-` |
| Sistema (E2E) | Flujos de usuario completos en el navegador | Cypress (viewport móvil) | `frontend/cypress/e2e/` | `E2E-` |
| Aceptación | Que la app sea entendible para el usuario real | Prueba de usabilidad con compañeros + SUS | Manual | `USA-` |

### 6.2 Tipos de prueba

| Tipo | Cómo se aplica | Ejemplos |
| --- | --- | --- |
| Funcional (flujo feliz) | Un caso por funcionalidad con datos válidos | API-02 registro, E2E-07 gasto en partes iguales |
| Negativa | Entradas inválidas, estados no permitidos, usuarios sin permiso | API-06 correo duplicado, API-91 montos que no cuadran |
| Valores límite | Mínimos, máximos y justo fuera de rango | API-89 propina 31 %, montos de 0.01 y 1,000,000 |
| Seguridad | Inyección, control de acceso, datos sensibles, fuerza bruta, anti-spam | SEC-01 a SEC-37 (ver `pruebas-seguridad.md`) |
| Rendimiento | Tiempo de respuesta en cada petición de Newman; prueba de carga con k6 | RNF-01 |
| Usabilidad | Tareas guiadas y cuestionario SUS | USA-01 |
| Compatibilidad | Smoke E2E en tres motores de navegador | RNF-07 (Playwright) |
| Accesibilidad | Auditoría Lighthouse | RNF-08 |
| Regresión | Toda la suite automatizada después de cada corrección o funcionalidad nueva | Rondas 2 a 8 |

### 6.3 Técnicas de diseño de casos

- **Partición de equivalencia (PE):** clases válidas e inválidas (correo válido / mal formado / duplicado).
- **Análisis de valores límite (VL):** montos, cantidades, longitud de textos, porcentaje de propina, tamaño del comprobante.
- **Transición de estados (TE):** solicitud de amistad (pendiente → aceptada/rechazada/cancelada) y pago (pendiente → confirmado/rechazado).
- **Conjetura de errores (EG):** centavos que se pierden al dividir, comodines `%` en la búsqueda, IDs de otro grupo.
- **Tablas de decisión:** permisos por rol (admin / integrante / ajeno) en grupos, gastos y pagos.

### 6.4 Automatización

- Meta: **al menos el 95 % de los casos automatizados** (la guía pide mínimo 5). Solo USA-01 y las auditorías de Lighthouse son manuales.
- Los datos se preparan por API (`cy.registerByApi`, `cy.createGroupByApi`) para que cada prueba sea independiente y repetible.
- Newman registra usuarios nuevos en cada ejecución (`qa.*@evenly.test`); Cypress usa `e2e.*@evenly.test`. Ninguna prueba depende del seed.
- El pipeline de GitHub Actions corre en cada push/PR: typecheck y lint → unitarias → build → migraciones sobre un PostgreSQL limpio → Newman → Cypress → despliegue (solo `main`).

### 6.5 Estrategia de regresión

1. Cada defecto corregido agrega o refuerza un caso que lo detecta.
2. Después de cada corrección se ejecuta **toda** la suite automatizada (no solo el caso afectado).
3. La evidencia de cada ronda se guarda con su número en `docs/evidencias/` (por ejemplo `newman-ronda8-ux.txt`).
4. Un defecto pasa a **Cerrado** solo cuando la regresión pasa completa.

## 7. Entorno y herramientas

| Elemento | Configuración |
| --- | --- |
| Local | Windows 11, Node 24, pnpm 11; backend en `localhost:3000`, frontend en `localhost:5173`; base PostgreSQL en Neon |
| CI | GitHub Actions (`ubuntu-latest`) con un servicio PostgreSQL limpio por ejecución y `JWT_SECRET` aleatorio |
| Producción | Vercel (frontend) y Render (API) con Neon; solo se ejecutan pruebas de humo y revisión de headers |
| Navegadores | Electron/Chrome (Cypress); Chromium, Firefox y WebKit (Playwright, para RNF-07) |

| Herramienta | Versión | Uso |
| --- | --- | --- |
| Vitest | 5.0 | Pruebas unitarias |
| Newman / Postman / Apidog | Newman 6.2 | Pruebas de API, reportes CLI y JUnit |
| Cypress | 16.1 | Pruebas E2E |
| Playwright | 1.x | Compatibilidad entre navegadores (planificado) |
| k6 | 1.x | Prueba de carga (planificado) |
| Lighthouse | Incluido en Chrome | Accesibilidad y buenas prácticas |
| GitHub Actions | — | Integración continua y despliegue |
| Git / GitHub | — | Control de versiones, ramas y pull requests |

## 8. Datos de prueba

| Tipo | Origen | Uso |
| --- | --- | --- |
| Cuentas demo | `backend/prisma/seed.ts` (contraseña común documentada en `docs/README.md`) | Pruebas manuales y exploratorias |
| Usuarios desechables | Creados por Newman y Cypress en cada ejecución | Pruebas automatizadas aisladas |
| Datos maliciosos | Definidos en los casos `SEC-` | Inyección SQL, comodines LIKE, campos extra, JSON inválido, cuerpos > 100 KB |
| Valores límite | Definidos en los casos `VL` | 0, 0.01, 1,000,000, 1,000,000.01, 3 decimales, propina 30/31 % |

Las pruebas nunca usan datos personales reales.

## 9. Criterios

### 9.1 Criterios de entrada (para iniciar una ronda)

1. El código compila: `pnpm typecheck` (backend) y `pnpm lint` + `pnpm build` (frontend) sin errores.
2. Las migraciones están aplicadas y `/health` responde `{ status: "ok", db: "ok" }`.
3. Los casos de la ronda están escritos y vinculados a un requisito en la matriz.
4. Las pruebas unitarias pasan (prueba de humo del entorno).
5. Los defectos que bloqueaban la ronda anterior están corregidos.

### 9.2 Criterios de salida (para dar por terminadas las pruebas)

| # | Criterio | Umbral |
| --- | --- | --- |
| S-1 | Requisitos cubiertos por al menos un caso | 100 % |
| S-2 | Casos planificados ejecutados | ≥ 95 % (los no ejecutados, justificados) |
| S-3 | Casos ejecutados que pasan | ≥ 95 % |
| S-4 | Casos de seguridad que pasan | 100 % |
| S-5 | Defectos críticos o altos abiertos | 0 |
| S-6 | Defectos corregidos verificados con regresión | 100 % |
| S-7 | Rendimiento (RNF-01) | Todas las respuestas < 3 s; carga con p95 < 3 s |
| S-8 | Usabilidad (RNF-03) | SUS ≥ 70 |
| S-9 | Pipeline de CI | En verde en `main` |

### 9.3 Criterios de suspensión y reanudación

| Se suspende si… | Se reanuda cuando… |
| --- | --- |
| La API o la base de datos no están disponibles | `/health` vuelve a responder `ok` |
| Un defecto crítico bloquea más del 30 % de los casos de la ronda | El defecto está corregido y pasa su caso de verificación |
| El entorno de CI falla por causas ajenas al producto | Se corrige el pipeline y pasa una ejecución de humo |

## 10. Gestión de defectos

| Severidad (impacto técnico) | Significado |
| --- | --- |
| Crítica | Bloquea una función principal o compromete la seguridad de los datos |
| Alta | Una función importante falla o da resultados incorrectos; hay forma de evitarlo |
| Media | Falla parcial o de validación con impacto limitado |
| Baja | Cosmético o de redacción |

| Prioridad (urgencia de corrección) | Significado |
| --- | --- |
| Alta | Se corrige antes de la siguiente ronda |
| Media | Se corrige antes del cierre |
| Baja | Puede quedar documentado como mejora |

**Ciclo de vida:** Nuevo → Asignado → En corrección → Corregido → Verificado (regresión OK) → Cerrado. Si la regresión
falla: Reabierto.

Cada defecto se registra en `registro-defectos.md` con: ID, título, severidad, prioridad, módulo y requisito, pasos de
reproducción, resultado esperado y obtenido, evidencia, causa, corrección (commit), caso de regresión y estado.

## 11. Métricas

| Métrica | Fórmula | Meta |
| --- | --- | --- |
| Cobertura de requisitos | requisitos con ≥ 1 caso aprobado ÷ requisitos totales × 100 | 100 % |
| Casos ejecutados | casos ejecutados ÷ casos planificados × 100 | ≥ 95 % |
| Tasa de aprobación | casos aprobados ÷ casos ejecutados × 100 | ≥ 95 % |
| Grado de automatización | casos automatizados ÷ casos totales × 100 | ≥ 95 % |
| Densidad de defectos | defectos encontrados ÷ KLOC del código fuente (sin código generado) | Informativa (se reporta) |
| Densidad por requisito | defectos ÷ requisitos probados | Informativa |
| Eficacia de corrección | defectos cerrados con regresión ÷ defectos encontrados × 100 | 100 % |
| Defectos reabiertos | defectos reabiertos ÷ defectos corregidos × 100 | 0 % |
| Tiempo de respuesta | promedio, mínimo, máximo y p95 por ronda | < 3 s |

Las métricas se reportan por ronda en `metricas.md` y se resumen en el informe de cierre.

## 12. Entregables de prueba

| Entregable | Archivo |
| --- | --- |
| Plan de pruebas | `docs/plan-de-pruebas.md` (este documento) |
| Requisitos de UX | `docs/requisitos-ux.md` |
| Casos de prueba | `docs/casos-de-prueba.md` |
| Matriz de trazabilidad | `docs/matriz-trazabilidad.md` |
| Pruebas de seguridad | `docs/pruebas-seguridad.md` |
| Scripts de automatización | `backend/src/lib/*.test.ts`, `docs/api/*.json`, `frontend/cypress/` |
| Evidencias de ejecución | `docs/evidencias/` (salidas de Vitest, Newman, Cypress, JUnit y capturas) |
| Registro de defectos | `docs/registro-defectos.md` |
| Métricas | `docs/metricas.md` |
| Informe de cierre | `docs/informe-de-cierre.md` |
| Video de demostración | Enlace de Drive (caso exitoso, caso fallido y caso de seguridad) |

## 13. Roles y responsabilidades

| Rol | Responsable | Responsabilidades |
| --- | --- | --- |
| Coordinación de QA, backend y CI | [Nombre del integrante 1] | Plan de pruebas, pruebas unitarias, pipeline, gestión de defectos, informe de cierre |
| Pruebas de API | Alexis [apellido] | Colección de Newman/Apidog, casos `API-` y `SEC-` de API, rendimiento |
| Pruebas E2E y usabilidad | Picon [nombre completo] | Specs de Cypress, compatibilidad, prueba de usabilidad (USA-01) |
| Aprobación | Docente del curso | Revisión de avances y de la entrega final |

> Completar los nombres según el Acta de Constitución del equipo; la asignación RACI detallada está en el acta.

## 14. Cronograma

| Ronda / hito | Fecha | Alcance | Evidencia |
| --- | --- | --- | --- |
| Ronda 1 | 2026-09-27 | Primera ejecución completa (auth, grupos, gastos, balances, seguridad) | `newman-ronda1-antes-de-corregir.txt`, `cypress-ronda1.txt` |
| Ronda 2 — regresión | 2026-09-27 | Verificación de DEF-002 y DEF-003 | `*-ronda2-regresion.txt` |
| Ronda 3 | 2026-09-27 | Gestión de grupos, integrantes, actividad y perfil | `*-ronda3-interfaz-completa.txt` |
| Ronda 4 | 2026-09-27 | Amigos e invitaciones | `*-ronda4-social.txt` |
| Ronda 5 | 2026-09-27 | Notificaciones en tiempo real | `*-ronda5-notificaciones.txt` |
| Ronda 6 | 2026-09-27 | Cuentas por ítems, cuenta rápida, datos bancarios y pagos | `newman-ronda6-cuentas-pagos.txt` |
| Avance 2 | 2026-09-29 | Presentación del proyecto funcionando | `docs/presentacion/` |
| Ronda 7 — regresión final | 2026-11-11 | Suite completa sobre la versión del Avance 2 | `newman-ronda7-final.txt`, `cypress-ronda6-final.txt` |
| Ronda 8 — UX | 2026-11-11 | UX-01 a UX-10: propina, montos exactos, deudas y recordatorios | `*-ronda8-ux.*`, `cypress-ronda7-ux.txt` |
| Ronda 9 — seguridad y no funcionales | Próxima | Headers de seguridad del frontend, carga con k6, compatibilidad con Playwright, Lighthouse | Pendiente |
| USA-01 | Próxima | Prueba de usabilidad con 5 compañeros + SUS | Pendiente |
| Regresión de cierre | Antes de la entrega | Suite completa en CI sobre `main` | Pendiente |
| Informe de cierre y video | Entrega final | Test Summary Report y demostración | Pendiente |

## 15. Riesgos y contingencias

| Riesgo | Probabilidad | Impacto | Mitigación |
| --- | --- | --- | --- |
| Arranque en frío de Render y Neon (primeras respuestas lentas) | Alta | Medio | Umbral de 3 s por petición; se reporta el máximo aparte; prueba de humo antes de medir |
| El límite de intentos (429) interfiere con las suites | Media | Medio | `AUTH_RATE_LIMIT=1000` en local y CI; en producción se mantiene 50 |
| Pruebas inestables por tiempos de red o del tiempo real | Media | Medio | Esperas automáticas de Cypress, sin `wait` fijos; datos preparados por API |
| Datos de prueba mezclados con los de producción | Baja | Alto | CI usa una base limpia; las suites crean usuarios desechables con dominio `evenly.test` |
| Un integrante no puede cumplir su parte | Media | Alto | Roles respaldados (RACI); toda la suite corre sin intervención en CI |
| Falta de tiempo para no funcionales | Media | Medio | Se priorizan los criterios de salida S-1 a S-6; los no funcionales pendientes se declaran en el informe de cierre |
| Una sola instancia del backend para el tiempo real | Baja | Bajo | Riesgo aceptado y documentado; fuera de alcance |

## 16. Aprobaciones

| Rol | Nombre | Firma | Fecha |
| --- | --- | --- | --- |
| Coordinación de QA | | | |
| Pruebas de API | | | |
| Pruebas E2E y usabilidad | | | |
| Docente | Ing. Edgar Raúl Molina Rey | | |
