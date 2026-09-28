# Métricas de calidad — Avance 2

**Periodo:** 2026-09-27 · **Fuente:** archivos en [evidencias/](evidencias/)

## Ejecución por ronda

| Métrica | Ronda 1 | Ronda 2 (regresión) | Ronda 3 (interfaz completa) |
| --- | --- | --- | --- |
| Casos ejecutados | 74 | 71 | 87 |
| Casos que pasan | 71 | 71 | 87 |
| Casos que fallan | 3 (SEC-14, E2E-07, E2E-08) | 0 | 0 |
| **Tasa de éxito** | **95.9 %** | **100 %** | **100 %** |
| Aserciones de Newman | 199 (1 falla) | 199 (0 fallas) | 227 (0 fallas) |
| Pruebas de Cypress | 10 (2 fallan) | 10 (0 fallan) | 18 (0 fallan) |
| Pruebas de Vitest | 18 (0 fallan) | 18 (0 fallan) | 18 (0 fallan) |

Las rondas 2 y 3 no repiten SEC-15, SEC-16 ni SEC-17 (scripts de una sola ejecución que no dependían de los cambios) ni USA-01 (pendiente). La ronda 3 agrega 16 casos nuevos (API-40 a API-47 y E2E-11 a E2E-18) y vuelve a ejecutar toda la suite anterior.

## Cobertura de casos

| Métrica | Valor |
| --- | --- |
| Casos documentados | 91 |
| Automatizados | 90 (98.9 %) |
| Por tipo | Funcional 37 · Negativo 23 · Límite 4 · Seguridad 22 · No funcional 5 (según la columna "Tipo" de `casos-de-prueba.md`; seguridad incluye la sección 6 más API-09, API-42, API-45 y E2E-09; no funcional incluye RNF-01, RNF-02, API-01, API-36 y USA-01) |
| Requisitos con cobertura completa | 16 de 17 (94 %) |
| Requisitos con cobertura parcial | 1 (RNF-03: falta USA-01); ver `matriz-trazabilidad.md` |

## Defectos

| Métrica | Valor |
| --- | --- |
| Defectos registrados | 5 |
| Por severidad | Crítica 1 · Alta 1 · Media 3 · Baja 0 |
| Por origen | Prototipo (mock) 3 · Código nuevo del Avance 2 2 |
| Detectados por pruebas automatizadas | 2 (DEF-002 con Newman, DEF-003 con Cypress) |
| Detectados por revisión estática | 3 |
| Corregidos y verificados con regresión | 5 de 5 (100 %) |
| Reabiertos | 0 |
| Defectos nuevos en la ronda 3 | 0 (un fallo de E2E-17 fue del script de la prueba, no del producto) |

## Rendimiento de la API (RNF-01)

Medido por Newman en el entorno local: backend en Windows y base de datos en Neon (us-east-2), una sola petición a la vez.

| Métrica | Ronda 1 | Ronda 2 | Ronda 3 |
| --- | --- | --- | --- |
| Peticiones | 53 | 53 | 61 |
| Tiempo promedio | 291 ms | 279 ms | 302 ms |
| Mínimo / máximo | 2 ms / 1372 ms | 2 ms / 1434 ms | 4 ms / 1782 ms |
| Desviación estándar | 304 ms | 289 ms | 319 ms |
| Umbral | < 3000 ms | < 3000 ms | < 3000 ms |
| Cumple | Sí | Sí | Sí |

Los máximos corresponden a las primeras peticiones contra Neon (conexión en frío) y a los registros (bcrypt con cost 10 tarda ~250 ms a propósito).

## Cómo actualizar estas métricas

1. Corre `pnpm test` y `pnpm test:api` en `backend/`, y `pnpm cy:run` en `frontend/`.
2. Guarda la salida en `evidencias/` con la fecha o el número de ronda en el nombre.
3. Actualiza las columnas "Ronda N" de `casos-de-prueba.md` y las tablas de este archivo.
