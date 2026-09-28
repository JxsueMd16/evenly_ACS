# Evidencias de ejecución

Salidas reales de las herramientas, sin editar (solo se quitaron los códigos de color ANSI). Todas son del 2026-09-27, en el entorno local contra la base de datos de desarrollo en Neon.

| Archivo | Qué contiene | Casos |
| --- | --- | --- |
| `newman-ronda1-antes-de-corregir.txt` | Salida de Newman, ronda 1: 199 aserciones, **1 falla** (SEC-14) | API-01…39, SEC-01…14, RNF-01, RNF-02 |
| `newman-junit-ronda1.xml` | Reporte JUnit de la ronda 1 | ídem |
| `newman-ronda2-regresion.txt` | Salida de Newman, ronda 2 tras corregir DEF-002: 199 aserciones, 0 fallas | ídem |
| `newman-junit-ronda2.xml` | Reporte JUnit de la ronda 2 | ídem |
| `cypress-ronda1.txt` | Salida de Cypress, ronda 1: 10 pruebas, **2 fallan** (E2E-07, E2E-08) | E2E-01…10 |
| `cypress-ronda1-screenshots/` | Capturas automáticas de los 2 fallos (muestran "El monto debe ser mayor a 0." con monto 90) | E2E-07, E2E-08 |
| `cypress-ronda2-regresion.txt` | Salida de Cypress, ronda 2 tras corregir DEF-003: 10 de 10 pasan | E2E-01…10 |
| `newman-ronda3-interfaz-completa.txt` | Salida de Newman, ronda 3 (se agrega la gestión de integrantes): 61 peticiones, 227 aserciones, 0 fallas | API-01…47, SEC-01…14, RNF-01, RNF-02 |
| `newman-junit-ronda3.xml` | Reporte JUnit de la ronda 3 | ídem |
| `cypress-ronda3-interfaz-completa.txt` | Salida de Cypress, ronda 3 (interfaz completa): 18 de 18 pasan | E2E-01…18 |
| `vitest-unitarias.txt` | Salida detallada de Vitest: 18 pruebas pasan | UT-01…06 |
| `sec-hash-contrasenas.txt` | Revisión de la tabla `Usuario`: 16 de 16 con hash bcrypt, 0 en texto plano | SEC-16 |
| `sec-log-servidor.txt` | Log del servidor durante una ejecución completa de Newman | SEC-17 |
| `sec-rate-limit.txt` | 52 intentos de login: 50 → 401, del 51 en adelante → 429 | SEC-15 |

Cada `pnpm test:api` escribe `newman-junit.xml` en esta carpeta; en CI se sube como artefacto del workflow (`evidencias-pruebas`).
