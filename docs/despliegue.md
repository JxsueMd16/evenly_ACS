# Despliegue de Evenly

| Pieza | Servicio | Plan | Se despliega… |
| --- | --- | --- | --- |
| Frontend (React/Vite) | Vercel | Hobby (gratis) | desde GitHub Actions, job `deploy-frontend`, solo en push a `main` y si el pipeline pasó |
| Backend (Express/Prisma) | Render | Free | por Render, con `autoDeployTrigger: checksPass` (ver `render.yaml`): espera a que pasen todos los checks del commit en `main` |
| Base de datos | Neon | Free | las migraciones corren en el build de Render (`pnpm db:deploy`) |

**Flujo de ramas:** se trabaja en `feature/*` → PR a `develop` (solo CI) → PR de `develop` a `main` → CI completo → despliegue.

## Qué esperar del plan gratuito

- **Render** apaga el backend tras 15 minutos sin tráfico; la primera petición después tarda cerca de 1 minuto. Antes de una demo, abre `https://<tu-api>.onrender.com/health` y espera a ver `{"status":"ok","db":"ok"}`.
- **Neon** suspende la base de datos tras 5 minutos sin uso; despierta en menos de un segundo.
- Límites: Render 750 h/mes, Neon 0.5 GB y 100 horas de cómputo/mes, Vercel 100 GB de transferencia/mes.

## Configuración inicial (una sola vez)

### 1. Base de datos de producción en Neon

Usa una base **separada** de la de desarrollo, que tiene miles de usuarios de prueba creados por Newman y Cypress.

1. Neon → tu proyecto → **Databases** → **New database** → nombre `evenly_prod`.
2. **Connect** → elige `evenly_prod`, activa **Pooled connection** y copia la cadena.
3. Cambia al final `sslmode=require` por `sslmode=verify-full`.

### 2. Frontend en Vercel

1. Vercel → **Add New… → Project** → importa `evenly_ACS`.
2. **Root Directory:** `frontend` · **Framework:** Vite (lo detecta solo).
3. **Environment Variables → Production:** `VITE_API_URL` = la URL de Render (paso 3). Si aún no la tienes, pon cualquier valor y la corriges después; se aplica en el siguiente despliegue.
4. **Deploy**. Anota el dominio que te asigna (por ejemplo `https://evenly-acs.vercel.app`).
5. Para GitHub Actions:
   - **Settings → General → Project ID** → cópialo.
   - **Team/Account Settings → General → ID** (empieza con `team_`) → cópialo.
   - **Account Settings → Tokens → Create** → crea un token con alcance a tu cuenta.

> `frontend/vercel.json` tiene `"git": { "deploymentEnabled": false }`: Vercel ya no despliega solo al hacer push; lo hace el pipeline.

### 3. Backend en Render

1. Render → **New → Blueprint** → conecta `evenly_ACS` → rama `main`. Detecta `render.yaml`.
2. Te pedirá:
   - `DATABASE_URL`: la cadena de Neon del paso 1.
   - `CORS_ORIGIN`: el dominio de Vercel del paso 2, **sin `/` al final** (por ejemplo `https://evenly-acs.vercel.app`).
3. `JWT_SECRET` se genera solo. **Apply**: hace el primer build, aplica las migraciones y arranca.
4. Copia la URL del servicio (`https://evenly-api-xxxx.onrender.com`) y comprueba `/health`.
5. Vuelve a Vercel y pon esa URL en `VITE_API_URL` si no lo hiciste.

### 4. Secretos en GitHub

Repositorio → **Settings → Secrets and variables → Actions → New repository secret**:

| Secreto | Valor |
| --- | --- |
| `VERCEL_TOKEN` | el token del paso 2.5 |
| `VERCEL_ORG_ID` | el ID de la cuenta/equipo (`team_…`) |
| `VERCEL_PROJECT_ID` | el Project ID (`prj_…`) |

Mientras falten, el job `deploy-frontend` se omite con un aviso (no falla). Después de agregarlos: **Actions → último run de `main` → Re-run all jobs**.

### 5. (Opcional) Cuentas demo en producción

Para que el docente pueda entrar con `paul@evenly.app` / `Evenly2026!`, ejecuta una vez desde tu máquina:

```bash
cd backend
DATABASE_URL="<cadena de evenly_prod>" pnpm db:seed
```

## Verificación después de cada despliegue

1. GitHub → **Actions**: los 4 jobs en verde; el resumen de `deploy-frontend` muestra la URL.
2. Render → **Events**: un deploy iniciado por el commit de `main`.
3. `https://<api>/health` → `{"status":"ok","db":"ok"}`.
4. Abrir el frontend, registrarse y crear un grupo.

## Problemas frecuentes

| Síntoma | Causa probable |
| --- | --- |
| "No se pudo conectar con el servidor" en la app | `CORS_ORIGIN` en Render no coincide exactamente con el dominio de Vercel, o `VITE_API_URL` apunta a otra URL. Tras cambiar `VITE_API_URL` hay que volver a desplegar el frontend. |
| La app tarda ~1 minuto la primera vez | El backend estaba dormido (plan Free de Render). |
| Render no despliega tras un merge a `main` | Algún check del commit falló, o el servicio no está en la rama `main`. |
| El build de Render falla en `db:deploy` | `DATABASE_URL` mal copiada o sin `sslmode`. |
