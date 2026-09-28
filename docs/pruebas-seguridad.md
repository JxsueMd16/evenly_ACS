# Pruebas de ciberseguridad — Evenly

**Fecha de ejecución:** 2026-09-27 · **Entorno:** backend local (`node dist/index.js`) contra la base de datos de desarrollo en Neon · **Herramientas:** Newman, curl, Cypress, script con Prisma

El Avance 2 pide como mínimo 3 casos, uno por categoría. Se ejecutaron 18 casos SEC/E2E de seguridad (SEC-01 a SEC-17 y E2E-10), más los casos de control de acceso de la ronda 3 (API-42, API-45, API-47, E2E-14, E2E-15), agrupados en las tres categorías pedidas y una de robustez.

## Controles implementados

| Control | Implementación | Archivo |
| --- | --- | --- |
| Validación estricta de entradas | zod: tipos, rangos, longitudes; objetos estrictos (rechaza campos desconocidos) | `backend/src/lib/schemas.ts` |
| Consultas parametrizadas | Prisma ORM; no hay SQL concatenado. `$queryRaw` solo se usa con template literal (`SELECT 1`) | `backend/src/routes/*` |
| Escape de comodines LIKE | `%`, `_` y `\` se escapan en la búsqueda | `backend/src/routes/users.ts` |
| Autenticación | JWT HS256 firmado con `JWT_SECRET` (≥ 32 caracteres); expira en `JWT_EXPIRES_IN` (1 día); en cada petición se verifica que el usuario siga existiendo | `backend/src/middleware/auth.ts` |
| Autorización por grupo | Integrante → puede leer y registrar gastos. ADMIN → puede editar, eliminar y gestionar integrantes. A quien no es integrante se le responde 404 para no revelar que el grupo existe | `backend/src/lib/access.ts` |
| Contraseñas | bcrypt (cost 10); política de 8–72 caracteres con letra y número; comparación con hash ficticio si el correo no existe (tiempo de respuesta similar) | `backend/src/routes/auth.ts` |
| Mensajes genéricos | El login no revela si el correo existe. Los errores 500 no incluyen stack ni detalles | `backend/src/lib/errors.ts` |
| Logs sin datos sensibles | Solo método, ruta (sin query string), estado y duración. Los errores registran nombre y código, nunca el cuerpo | `backend/src/app.ts`, `backend/src/lib/errors.ts` |
| Fuerza bruta | express-rate-limit: 50 intentos de login/registro por IP cada 15 minutos | `backend/src/routes/auth.ts` |
| Cabeceras HTTP | helmet (nosniff, frameguard, HSTS, etc.); `X-Powered-By` desactivado; CORS restringido a `CORS_ORIGIN` | `backend/src/app.ts` |
| Tamaño de petición | `express.json({ limit: "100kb" })` | `backend/src/app.ts` |
| Respuestas sin hash | `select` explícito de campos públicos; `passwordHash` nunca se serializa | `backend/src/lib/dto.ts` |

---

## Categoría 1 — Validación de entradas (inyección en montos y búsqueda)

| ID | Ataque | Petición | Esperado | Obtenido | Resultado |
| --- | --- | --- | --- | --- | --- |
| SEC-07 | Inyección SQL en el monto | `POST /groups/:id/expenses` con `"amount": "100; DROP TABLE \"Gasto\"; --"` | 400 `VALIDATION_ERROR`; la tabla sigue existiendo | 400 "El monto debe ser un número."; los siguientes casos crean gastos sin problema | Pasa |
| SEC-03 | Inyección SQL en la búsqueda | `GET /users?search=%' OR 1=1 --` | 200 con lista vacía | 200, `users: []` | Pasa |
| SEC-14 | Comodines LIKE (enumeración de usuarios) | `GET /users?search=%%` | 200 con lista vacía | Ronda 1: **10 usuarios con nombre y correo (DEF-002)** · Ronda 2: `[]` | Pasa tras la corrección |
| SEC-01 | Inyección SQL en el login | `POST /auth/login` con `{"email": "' OR '1'='1' --", ...}` | 400; sin token | 400 "Ingresa un correo válido." | Pasa |
| API-09 | Asignación masiva | registro con `passwordHash` e `id` extra | 400 | 400 (objeto estricto) | Pasa |
| API-24 / API-27 / API-28 | Montos fuera de rango | −25 / 1,000,000.01 / 10.005 | 400 | 400 | Pasa |
| E2E-09 | Inyección desde la UI | escribir `12.345'; DROP TABLE--` en el monto | El campo solo acepta `12.34` | `12.34` | Pasa |

**Análisis.** La inyección SQL clásica no aplica porque Prisma parametriza todos los valores. El riesgo real estaba en la semántica de LIKE (DEF-002): la consulta era segura desde el punto de vista de SQL, pero dejaba enumerar a todos los usuarios. Los montos se validan como `number` de JSON, así que un string nunca llega a la base de datos.

## Categoría 2 — Control de acceso (grupos y gastos ajenos)

Actores: **A** = admin del grupo, **B** y **D** = integrantes, **C** = usuario registrado que no pertenece al grupo.

| ID | Actor | Acción | Esperado | Obtenido | Resultado |
| --- | --- | --- | --- | --- | --- |
| SEC-04 | C | `GET /groups/:id` | 404, sin datos del grupo | 404 "Grupo no encontrado."; el nombre no aparece en la respuesta | Pasa |
| SEC-05 | C | `PATCH /groups/:id` | 404 | 404 | Pasa |
| SEC-08 | C | `POST /groups/:id/expenses` | 404 | 404 | Pasa |
| SEC-09 | C | `GET /groups/:id/expenses` | 404, sin montos | 404; la respuesta no contiene `amount` | Pasa |
| SEC-06 | B (no admin) | `PATCH /groups/:id` | 403 | 403 "Solo el administrador del grupo puede realizar esta acción." | Pasa |
| API-37 | B (no admin) | `DELETE /groups/:id` | 403 | 403 | Pasa |
| SEC-10 | D (no creó ni pagó el gasto) | `DELETE /groups/:id/expenses/:eid` | 403 | 403 | Pasa |
| API-42 | B (no admin) | `POST /groups/:id/members` | 403 | 403 | Pasa |
| API-45 | D (no admin) | `DELETE /groups/:id/members/:C` (quitar a otro) | 403 | 403 | Pasa |
| API-47 | C después de salir | `GET /groups/:id` | 404 | 404 | Pasa |
| E2E-14 | B en la UI | ver un gasto que no creó ni pagó | sin botón "Eliminar gasto" | el botón no existe en el DOM | Pasa |
| E2E-15 | B en la UI | abrir "Ajustes del grupo" | sin formulario de edición ni opción de eliminar | solo ve "Salir del grupo" | Pasa |
| SEC-02 | cualquiera | JWT de A con `sub` cambiado a B, sin volver a firmar | 401 | 401 "Tu sesión expiró o no es válida." | Pasa |
| API-13 | anónimo | `GET /auth/me` sin token | 401 | 401 | Pasa |
| E2E-10 | C en la UI | abrir `/groups/<id de otro>` escribiendo la URL | redirige sin mostrar datos | redirige a `/groups` con el aviso "Ese grupo no existe o no perteneces a él." | Pasa |
| E2E-05 | UI | token alterado en localStorage | cierra sesión | la API responde 401, se cierra la sesión y la app manda a `/login` | Pasa |

**Análisis.** La autorización se verifica en el servidor en cada ruta (`requireMembership` / `requireAdmin`), no solo ocultando botones en la interfaz. Un usuario ajeno recibe 404 en vez de 403, así no puede confirmar que un ID de grupo existe (evita IDOR y la enumeración de grupos).

## Categoría 3 — Manejo de datos sensibles

| ID | Verificación | Método | Resultado obtenido | Resultado |
| --- | --- | --- | --- | --- |
| SEC-16 | Contraseñas hasheadas con bcrypt | Script con Prisma sobre la tabla `Usuario` (`evidencias/sec-hash-contrasenas.txt`) | 16 de 16 usuarios con hash `$2b$10$…` de 60 caracteres; 0 en texto plano | Pasa |
| API-02…05, API-10, API-14 | Las respuestas no exponen la contraseña ni el hash | Aserciones de Newman (`not.have.property("passwordHash")`) y regex `/passwordHash\|\$2[aby]\$/` sobre el cuerpo | No aparecen en ninguna respuesta | Pasa |
| SEC-17 | Los logs no contienen datos sensibles ni financieros | Revisión del log completo de una ejecución de Newman (`evidencias/sec-log-servidor.txt`) | Solo líneas `MÉTODO /ruta ESTADO ms`; 0 coincidencias de contraseña, hash, `amount` o texto de búsqueda | Pasa |
| API-11 / API-12 | El login no revela si una cuenta existe | Mismo mensaje y tiempo similar para una contraseña incorrecta y un correo inexistente | Mismo mensaje; 144 ms vs 154 ms | Pasa |
| SEC-11 | Los errores no exponen detalles internos | JSON mal formado; regex `/stack\|prisma\|SELECT/` sobre la respuesta | 400 `INVALID_JSON` con mensaje genérico | Pasa |
| SEC-13 | Cabeceras | `GET /health` | Sin `X-Powered-By`; `X-Content-Type-Options: nosniff` | Pasa |
| SEC-15 | Fuerza bruta en el login | 52 intentos seguidos (`evidencias/sec-rate-limit.txt`) | 1–50 → 401; 51 en adelante → 429, incluso con la contraseña correcta | Pasa |
| — | Secretos fuera del repositorio | `.env` en `.gitignore`; solo se versiona `.env.example` sin valores; `JWT_SECRET` generado por Render | Verificado con `git status` | Pasa |

## Riesgos conocidos y fuera de alcance

| Riesgo | Situación | Mitigación propuesta |
| --- | --- | --- |
| El JWT se guarda en `localStorage` (expuesto si hubiera XSS) | Aceptado para el alcance del curso. React escapa el contenido por defecto y no se usa `dangerouslySetInnerHTML` | Migrar a cookie `httpOnly` + `SameSite` si el proyecto sigue |
| No se pueden revocar tokens (no hay lista negra) | Expiración corta (1 día) | Refresh tokens o `tokenVersion` por usuario |
| El registro revela si un correo ya existe (409) | Necesario para la UX del registro | Rate limit de 50 intentos por IP cada 15 minutos |
| El rate limit se guarda en memoria | Se reinicia con cada deploy; con más de una instancia cada una lleva su propio contador | Usar Redis si se escala a varias instancias |
| No hay escaneo automático de dependencias | — | Agregar `pnpm audit` o Dependabot en GitHub |
