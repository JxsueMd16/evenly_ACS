# Casos de prueba — Evenly (Avance 2)

**Versión:** 1.1 · **Fecha:** 2026-09-27 · **Rama:** `develop`

## Convenciones

**Prefijos de ID**

| Prefijo | Nivel | Herramienta | Ubicación |
| --- | --- | --- | --- |
| `UT-` | Unitaria | Vitest | `backend/src/lib/*.test.ts` |
| `API-` | API funcional | Newman / Apidog | `docs/api/evenly.postman_collection.json` |
| `SEC-` | Seguridad | Newman / script | colección + `docs/evidencias/sec-*.txt` |
| `E2E-` | Interfaz | Cypress | `frontend/cypress/e2e/*.cy.ts` |
| `RNF-` | No funcional | Newman | script a nivel de colección (corre en cada petición) |
| `USA-` | Usabilidad | Manual | — |

**Tipo:** F = funcional (flujo feliz) · N = negativo · L = valor límite · NF = no funcional · S = seguridad

**Técnica:** PE = partición de equivalencia · VL = análisis de valores límite · TE = transición de estados · EG = conjetura de errores (error guessing)

**Rondas de ejecución**

- **Ronda 1** (2026-09-27): primera ejecución completa. Evidencia: `evidencias/newman-ronda1-antes-de-corregir.txt`, `evidencias/cypress-ronda1.txt`.
- **Ronda 2 — regresión** (2026-09-27), después de corregir DEF-002 y DEF-003. Evidencia: `evidencias/newman-ronda2-regresion.txt`, `evidencias/cypress-ronda2-regresion.txt`.
- **Ronda 3 — interfaz completa** (2026-09-27): se agregaron la edición y eliminación de grupos, la gestión de integrantes y la eliminación de gastos en la UI, con los casos de la sección 8. Se volvió a correr **toda** la suite automatizada (casos nuevos y anteriores). Evidencia: `evidencias/newman-ronda3-interfaz-completa.txt`, `evidencias/cypress-ronda3-interfaz-completa.txt`.

Precondiciones generales: backend en `http://localhost:3000` con migraciones aplicadas y seed cargado; frontend en `http://localhost:5173`. La colección de Newman registra 4 usuarios nuevos por ejecución: **A** (admin del grupo), **B** y **D** (integrantes) y **C** (ajeno al grupo).

---

## 1. Autenticación (RF-01, RF-02, RF-03)

| ID | Tipo | Técnica | Descripción | Datos de entrada | Resultado esperado | Req. | Ronda 1 | Ronda 2 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| API-02 | F | PE | Registro válido (usuario A) | nombre, correo único, `Prueba2026` | 201; devuelve `token` y `user`; sin `password` ni `passwordHash` | RF-01 | Pasa | Pasa |
| API-03 | F | PE | Registro válido (usuario B) | ídem | 201 | RF-01 | Pasa | Pasa |
| API-04 | F | PE | Registro válido (usuario C) | ídem | 201 | RF-01 | Pasa | Pasa |
| API-05 | F | PE | Registro válido (usuario D) | ídem | 201 | RF-01 | Pasa | Pasa |
| API-06 | N | PE | Registro con correo ya registrado | correo de A | 409 `EMAIL_TAKEN` | RF-01 | Pasa | Pasa |
| API-07 | N | VL | Contraseña bajo el mínimo | `abc` (3 caracteres; mínimo 8) | 400 `VALIDATION_ERROR` | RF-01 | Pasa | Pasa |
| API-08 | N | PE | Correo con formato inválido | `no-es-un-correo` | 400 `VALIDATION_ERROR` | RF-01 | Pasa | Pasa |
| API-09 | S | EG | Asignación masiva: campos no permitidos | body con `passwordHash` e `id` extra | 400; no se crea la cuenta | RF-01, RNF-04 | Pasa | Pasa |
| API-10 | F | PE | Login correcto | correo y contraseña de A | 200; JWT con 3 segmentos; sin hash en la respuesta | RF-02 | Pasa | Pasa |
| API-11 | N | PE | Login con contraseña incorrecta | `Incorrecta99` | 401 "Correo o contraseña incorrectos." | RF-02 | Pasa | Pasa |
| API-12 | N | PE | Login con correo inexistente | `nadie@evenly.test` | 401 con el **mismo** mensaje que API-11 | RF-02, RNF-06 | Pasa | Pasa |
| API-13 | N | PE | Perfil sin token | sin header `Authorization` | 401 `UNAUTHORIZED` | RF-03 | Pasa | Pasa |
| API-14 | F | PE | Perfil con token válido | token de A | 200; `user.id` = A; sin hash | RF-03 | Pasa | Pasa |
| E2E-01 | F | PE | Registro desde la UI | nombre, correo único, `Prueba2026` ×2 | Redirige a `/`; saludo con el nombre; tarjeta "Balance total" | RF-01 | Pasa | Pasa |
| E2E-02 | N | VL | Contraseña corta en el formulario | `corta` | Mensaje "Mínimo 8 caracteres."; **no** se llama a la API; sigue en `/register` | RF-01, RNF-03 | Pasa | Pasa |
| E2E-03 | N | PE | Login con credenciales incorrectas en la UI | `paul@evenly.app` / `Incorrecta99` | Toast "Correo o contraseña incorrectos."; sigue en `/login`; no se guarda token | RF-02, RNF-03 | Pasa | Pasa |
| E2E-04 | N | TE | Ruta protegida sin sesión | visitar `/groups` sin sesión | Redirige a `/login` | RF-03 | Pasa | Pasa |
| E2E-05 | N | TE | Token alterado o expirado | token válido + un carácter extra | La API responde 401; la app cierra la sesión y manda a `/login` | RF-03, RNF-05 | Pasa | Pasa |

## 2. Usuarios (RF-04)

| ID | Tipo | Técnica | Descripción | Datos de entrada | Resultado esperado | Req. | Ronda 1 | Ronda 2 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| API-15 | F | PE | Buscar usuario por correo | `search=<correo de B>` | 200; la lista incluye a B | RF-04 | Pasa | Pasa |

## 3. Grupos (RF-05, RF-06, RF-07)

| ID | Tipo | Técnica | Descripción | Datos de entrada | Resultado esperado | Req. | Ronda 1 | Ronda 2 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| API-16 | N | VL | Crear grupo con nombre vacío | `name: "   "` | 400 `VALIDATION_ERROR` | RF-05 | Pasa | Pasa |
| API-17 | F | PE | Crear grupo con integrantes | nombre, `memberIds: [B, D]` | 201; 3 integrantes; A con rol `ADMIN`; `myBalance` = 0 | RF-05 | Pasa | Pasa |
| API-18 | F | PE | Listar mis grupos (como integrante) | token de B | 200; incluye el grupo creado por A | RF-06 | Pasa | Pasa |
| API-19 | F | PE | El admin renombra el grupo | `PATCH { name }` con token de A | 200; nombre actualizado | RF-07 | Pasa | Pasa |
| API-37 | N | PE | Un integrante que no es admin intenta eliminar el grupo | `DELETE` con token de B | 403 | RF-07, RNF-05 | Pasa | Pasa |
| API-38 | F | PE | El admin elimina el grupo | `DELETE` con token de A | 204; se borran también sus gastos (cascada) | RF-07 | Pasa | Pasa |
| API-39 | F | TE | Consultar un grupo eliminado | `GET` del grupo borrado | 404 | RF-07 | Pasa | Pasa |
| E2E-06 | F | PE | Crear grupo desde la UI buscando al integrante por correo | nombre "Viaje E2E" + correo del amigo | Toast "Grupo creado"; el grupo aparece en la lista con 2 integrantes | RF-04, RF-05 | Pasa | Pasa |

## 4. Gastos (RF-08, RF-09)

| ID | Tipo | Técnica | Descripción | Datos de entrada | Resultado esperado | Req. | Ronda 1 | Ronda 2 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| API-20 | F | EG | Gasto equitativo que no divide exacto | 100.00 entre A, B y D | 201; partes 33.34 / 33.33 / 33.33; suman exactamente 100.00 | RF-08 | Pasa | Pasa |
| API-21 | F | PE | Gasto por ítem que cuadra | 30.50 = 10.25 (A) + 20.25 (B) | 201; `splitType: itemized` | RF-08 | Pasa | Pasa |
| API-22 | N | VL | Gasto por ítem que no cuadra por un centavo | 50.00 ≠ 20.00 + 29.99 | 400 `SPLIT_MISMATCH` | RF-08 | Pasa | Pasa |
| API-23 | N | VL | Monto 0 (justo debajo del mínimo) | `amount: 0` | 400 `VALIDATION_ERROR` | RF-08 | Pasa | Pasa |
| API-24 | N | PE | Monto negativo | `amount: -25` | 400 `VALIDATION_ERROR` | RF-08 | Pasa | Pasa |
| API-25 | L | VL | Monto mínimo válido | `amount: 0.01` | 201 | RF-08 | Pasa | Pasa |
| API-26 | L | VL | Monto máximo válido | `amount: 1000000` | 201 | RF-08 | Pasa | Pasa |
| API-27 | N | VL | Monto justo sobre el máximo | `amount: 1000000.01` | 400 `VALIDATION_ERROR` | RF-08 | Pasa | Pasa |
| API-28 | N | VL | Monto con 3 decimales | `amount: 10.005` | 400 `VALIDATION_ERROR` | RF-08 | Pasa | Pasa |
| API-29 | N | PE | Participante que no es del grupo | participantes A y C | 400 `NOT_A_MEMBER` | RF-08 | Pasa | Pasa |
| API-30 | F | PE | El admin elimina un gasto | `DELETE` del gasto de 1,000,000 | 204 | RF-09 | Pasa | Pasa |
| API-31 | F | PE | El admin elimina un gasto | `DELETE` del gasto de 0.01 | 204 | RF-09 | Pasa | Pasa |
| API-32 | F | PE | Listar gastos del grupo | token de D | 200; quedan "Taxi" y "Cena", del más reciente al más antiguo | RF-09 | Pasa | Pasa |
| E2E-07 | F | PE | Agregar gasto equitativo desde la UI | 90.00 "Pizza" entre 2 | Vuelve al detalle; muestra "Pizza", "tu parte 45.00", "Tú +45.00" y la sección "Para quedar a mano" | RF-08, RF-10 | **Falla** (DEF-003) | Pasa |
| E2E-08 | N | VL | División por ítem descuadrada en la UI | 50 = 20 + 25 | Mensaje "La división no cuadra. Faltan…"; no se llama a la API; sigue en el formulario | RF-08, RNF-03 | **Falla** (DEF-003) | Pasa |
| E2E-09 | S | EG | Entrada maliciosa en el campo monto | escribir `12.345'; DROP TABLE--` | El campo solo acepta `12.34` | RF-08, RNF-04 | Pasa | Pasa |

## 5. Balances y actividad (RF-10, RF-11)

| ID | Tipo | Técnica | Descripción | Datos de entrada | Resultado esperado | Req. | Ronda 1 | Ronda 2 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| API-33 | F | PE | Balances del grupo después de API-20 y API-21 | — | Suma de balances = 0; A = +56.41, B = −23.08, D = −33.33; los pagos sugeridos suman 56.41 | RF-10 | Pasa | Pasa |
| API-34 | F | PE | Actividad reciente | `limit=5`, token de D | 200; incluye los 2 gastos del grupo con el nombre de quien pagó | RF-11 | Pasa | Pasa |
| API-35 | F | PE | Historial de pagos | `paidByMe=true`, token de B | 200; todos los gastos listados los pagó B | RF-11 | Pasa | Pasa |
| UT-01 | F | EG | Conversión a centavos sin error de punto flotante | `0.1 + 0.2`, `62.5`, `1000000` | 30, 6250, 100000000 | RF-10 | Pasa | Pasa |
| UT-02 | L | VL | Validación de máximo 2 decimales | 12, 12.5, 0.01, 999999.99 / 12.345, 0.001 | Acepta los primeros; rechaza los segundos | RF-08 | Pasa | Pasa |
| UT-03 | F | EG | Reparto equitativo con centavos sobrantes | 100.00 entre 3 | [33.34, 33.33, 33.33], suma exacta | RF-08 | Pasa | Pasa |
| UT-04 | L | VL | Reparto en casos borde | 0.01 entre 3; lista vacía | [0.01, 0, 0]; [] | RF-08 | Pasa | Pasa |
| UT-05 | F | PE | Balance neto del grupo "Viaje a la playa" | 240 (Paul), 45 (Ana), 78 (Kevin) entre 3 | Paul +119, Ana −76, Kevin −43; la suma es 0; un integrante sin gastos queda en 0 | RF-10 | Pasa | Pasa |
| UT-06 | F | PE | Pagos sugeridos | balances de UT-05; todos en 0 | Ana → Paul 76, Kevin → Paul 43; sin pagos si todos están en 0 | RF-10 | Pasa | Pasa |

## 6. Seguridad (RNF-04, RNF-05, RNF-06)

Detalle, evidencia y análisis en [pruebas-seguridad.md](pruebas-seguridad.md).

| ID | Categoría | Descripción | Datos de entrada | Resultado esperado | Req. | Ronda 1 | Ronda 2 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SEC-01 | Validación de entradas | Inyección SQL en el login | correo `' OR '1'='1' --` | 400; sin token; sin detalles internos | RNF-04 | Pasa | Pasa |
| SEC-02 | Control de acceso | Token manipulado (se cambia `sub` sin volver a firmar) | JWT de A con `sub` de B | 401 | RNF-05 | Pasa | Pasa |
| SEC-03 | Validación de entradas | Inyección SQL en la búsqueda | `search=%' OR 1=1 --` | 200 con lista vacía; no devuelve toda la tabla | RNF-04 | Pasa | Pasa |
| SEC-04 | Control de acceso | Usuario ajeno lee un grupo | `GET /groups/:id` con token de C | 404; la respuesta no incluye el nombre del grupo | RNF-05 | Pasa | Pasa |
| SEC-05 | Control de acceso | Usuario ajeno edita un grupo | `PATCH` con token de C | 404 | RNF-05 | Pasa | Pasa |
| SEC-06 | Control de acceso | Integrante sin rol de admin edita el grupo | `PATCH` con token de B | 403 | RNF-05 | Pasa | Pasa |
| SEC-07 | Validación de entradas | Inyección en el monto | `amount: "100; DROP TABLE \"Gasto\"; --"` | 400 `VALIDATION_ERROR` | RNF-04 | Pasa | Pasa |
| SEC-08 | Control de acceso | Usuario ajeno registra un gasto | `POST .../expenses` con token de C | 404 | RNF-05 | Pasa | Pasa |
| SEC-09 | Control de acceso | Usuario ajeno lista los gastos | `GET .../expenses` con token de C | 404; no hay montos en la respuesta | RNF-05, RNF-06 | Pasa | Pasa |
| SEC-10 | Control de acceso | Integrante sin permiso borra un gasto ajeno | `DELETE` con token de D | 403 | RNF-05 | Pasa | Pasa |
| SEC-11 | Robustez | JSON mal formado | `{ "email": "a@b.com", ` | 400 `INVALID_JSON`; sin stack | RNF-02, RNF-06 | Pasa | Pasa |
| SEC-12 | Robustez | Cuerpo mayor a 100 KB | nombre de 150 KB | 413 `PAYLOAD_TOO_LARGE` | RNF-04 | Pasa | Pasa |
| SEC-13 | Configuración | Cabeceras de seguridad | `GET /health` | Sin `X-Powered-By`; `X-Content-Type-Options: nosniff` | RNF-06 | Pasa | Pasa |
| SEC-14 | Validación de entradas | Comodines LIKE en la búsqueda (enumeración de usuarios) | `search=%%` | 200 con lista vacía | RNF-04, RNF-06 | **Falla** (DEF-002) | Pasa |
| SEC-15 | Fuerza bruta | Límite de intentos de login | 52 logins fallidos seguidos desde la misma IP | Intentos 1–50 → 401; del 51 en adelante → 429 | RNF-04 | Pasa | — (1 ejecución) |
| SEC-16 | Datos sensibles | Contraseñas guardadas con bcrypt | consulta a la tabla `Usuario` | 100 % de los registros con hash `$2b$10$` de 60 caracteres; ninguno en texto plano | RNF-06 | Pasa | — (1 ejecución) |
| SEC-17 | Datos sensibles | El log del servidor no guarda datos sensibles | log de una ejecución completa de Newman | Solo método, ruta, estado y duración; sin contraseñas, tokens, montos ni búsquedas | RNF-06 | Pasa | — (1 ejecución) |
| E2E-10 | Control de acceso | Abrir el grupo de otro usuario cambiando la URL | `/groups/<id ajeno>` | Redirige a `/groups` con el aviso "Ese grupo no existe o no perteneces a él."; no se muestra el nombre del grupo | RNF-05 | Pasa | Pasa |

## 7. No funcionales (RNF-01, RNF-02, RNF-03)

| ID | Tipo | Descripción | Criterio de aceptación | Cómo se mide | Req. | Ronda 1 | Ronda 2 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| RNF-01 | Rendimiento | Tiempo de respuesta de la API | Cada respuesta tarda menos de 3000 ms (local contra Neon) | Aserción a nivel de colección en las 53 peticiones | RNF-01 | Pasa (máx. 1372 ms) | Pasa (máx. 1434 ms) |
| RNF-02 | Mantenibilidad / usabilidad de la API | Formato de error consistente | Toda respuesta ≥ 400 tiene `error.code` y `error.message` de tipo string | Aserción a nivel de colección | RNF-02 | Pasa | Pasa |
| API-01 | Disponibilidad | Health check con base de datos | `GET /health` → `{status:"ok", db:"ok"}` | Newman | RNF-01 | Pasa | Pasa |
| API-36 | Robustez | Ruta inexistente | 404 `NOT_FOUND` con el formato estándar | Newman | RNF-02 | Pasa | Pasa |
| USA-01 | Usabilidad | Prueba con 3–5 usuarios: registrarse, crear un grupo, registrar un gasto dividido por ítem y entender el balance | ≥ 80 % completa las tareas sin ayuda; SUS ≥ 68 | Observación y cuestionario SUS | RNF-03 | **Pendiente** (responsable: Picon) | — |

---

## 8. Gestión de grupo, integrantes, actividad y perfil (ronda 3)

Casos que se agregaron al completar la interfaz. Todos los casos de las secciones 1 a 7 que son automatizados también se volvieron a ejecutar en la ronda 3 y pasaron.

| ID | Tipo | Técnica | Descripción | Datos de entrada | Resultado esperado | Req. | Ronda 3 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| API-40 | F | PE | El admin agrega a un integrante | `POST /groups/:id/members { userId: C }` con token de A | 201; C aparece en `memberIds` | RF-07 | Pasa |
| API-41 | N | PE | Agregar a alguien que ya es integrante | C otra vez | 409 `ALREADY_MEMBER` | RF-07 | Pasa |
| API-42 | S | PE | Un integrante que no es admin intenta agregar | token de B | 403 `FORBIDDEN` | RF-07, RNF-05 | Pasa |
| API-43 | N | PE | Quitar a un integrante que participa en gastos | quitar a B (pagó "Taxi") | 409 `MEMBER_HAS_EXPENSES` | RF-07 | Pasa |
| API-44 | N | TE | El admin intenta salir de su propio grupo | A se quita a sí mismo | 409 `ADMIN_CANNOT_LEAVE` | RF-07 | Pasa |
| API-45 | S | PE | Un integrante que no es admin intenta quitar a otro | D quita a C | 403 `FORBIDDEN` | RF-07, RNF-05 | Pasa |
| API-46 | F | TE | Un integrante sin gastos sale del grupo | C se quita a sí mismo | 204 | RF-07 | Pasa |
| API-47 | F | TE | Quien salió ya no puede ver el grupo | `GET /groups/:id` con token de C | 404 | RF-07, RNF-05 | Pasa |
| E2E-11 | F | PE | El admin edita el grupo desde "Ajustes del grupo" | nombre "Nombre nuevo", categoría Transporte | "Guardar cambios" está deshabilitado mientras no haya cambios; toast "Grupo actualizado"; el encabezado muestra el nombre nuevo | RF-07 | Pasa |
| E2E-12 | F | PE | El admin agrega a un integrante buscándolo y luego lo quita | correo del usuario | "se unió al grupo" → Integrantes (3); confirmar "Quitar" → "ya no es parte del grupo" → Integrantes (2) | RF-04, RF-07 | Pasa |
| E2E-13 | N | PE | Quitar a un integrante con gastos desde la UI | integrante que participa en un gasto | El diálogo de confirmación sigue abierto y muestra "participa en gastos del grupo"; el integrante sigue en la lista | RF-07, RNF-03 | Pasa |
| E2E-14 | F | PE | Eliminar un gasto | gasto "Hotel" de 100 entre 2 | Un integrante que no creó ni pagó el gasto no ve el botón; el admin confirma, aparece el toast "Gasto eliminado" y su balance pasa de +50.00 a "Al día" | RF-09, RF-10, RNF-05 | Pasa |
| E2E-15 | F | TE | Un integrante que no es admin sale del grupo | — | Ve "Solo el administrador puede editar el grupo." sin el formulario de edición; tras confirmar "Salir" vuelve a `/groups` y el grupo ya no aparece | RF-07, RNF-05 | Pasa |
| E2E-16 | F | TE | El admin elimina un grupo con gastos | — | La confirmación advierte que no se puede deshacer; vuelve a `/groups` con el toast "Grupo eliminado" y el grupo ya no aparece | RF-07 | Pasa |
| E2E-17 | F | PE | La actividad muestra gastos de mis grupos con quién pagó | un gasto propio y uno de otro integrante | "Peajes" muestra "<nombre> pagó" y el nombre del grupo; "Gasolina" muestra "Tú pagaste" | RF-11 | Pasa |
| E2E-18 | F | PE | El historial del perfil solo muestra gastos propios y el balance total | pagó 80; otro pagó 20; ambos entre 2 | Aparece "Súper"; "Cine" no aparece; muestra "Te deben 30.00" | RF-10, RF-11 | Pasa |

Nota sobre E2E-17: en su primera ejecución falló por un selector del propio script (`.parents("a")`); la pantalla mostraba los datos correctos (se revisó la captura). Se corrigió el script a `cy.contains("a", …)`. No se registra como defecto porque no es un error del producto.

## Resumen

| Nivel | Casos | Automatizados | Ronda 1 (pasan / ejecutados) | Ronda 2 (pasan / ejecutados) | Ronda 3 (pasan / ejecutados) |
| --- | --- | --- | --- | --- | --- |
| Unitarias (UT) | 6 (18 aserciones de Vitest) | 6 | 6 / 6 | 6 / 6 | 6 / 6 |
| API (API) | 47 | 47 | 39 / 39 | 39 / 39 | 47 / 47 |
| Seguridad (SEC) | 17 | 14 en Newman + 3 con script | 16 / 17 | 14 / 14 (re-ejecutados) | 14 / 14 |
| E2E (E2E) | 18 | 18 | 8 / 10 | 10 / 10 | 18 / 18 |
| No funcionales (RNF, USA) | 3 | 2 | 2 / 2 | 2 / 2 | 2 / 2 |
| **Total** | **91** | **90** | **71 / 74 (95.9 %)** | **71 / 71 (100 %)** | **87 / 87 (100 %)** |

USA-01 está documentado pero no se ha ejecutado. SEC-15, SEC-16 y SEC-17 se ejecutaron una sola vez con scripts (sus evidencias están en `evidencias/sec-*.txt`) y no dependían de las correcciones, por eso no se repitieron en las rondas 2 y 3.
