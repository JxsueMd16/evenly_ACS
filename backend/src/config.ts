import "dotenv/config";
import { z } from "zod";

/**
 * Variables de entorno validadas al arrancar. Si falta alguna obligatoria el
 * servidor no inicia (mejor fallar en el deploy que correr sin JWT_SECRET).
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL es obligatoria"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET debe tener al menos 32 caracteres"),
  JWT_EXPIRES_IN: z.string().default("1d"),
  /** Orígenes permitidos para CORS, separados por coma. */
  CORS_ORIGIN: z.string().default("http://localhost:5173,http://127.0.0.1:5173"),
  /** Intentos de login/registro permitidos por IP cada 15 minutos. */
  AUTH_RATE_LIMIT: z.coerce.number().int().positive().default(50),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Solo se listan los nombres de las variables, nunca sus valores.
  const problems = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
  console.error(`Configuración inválida:\n${problems}`);
  process.exit(1);
}

export const config = {
  ...parsed.data,
  corsOrigins: parsed.data.CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean),
  isProduction: parsed.data.NODE_ENV === "production",
};
