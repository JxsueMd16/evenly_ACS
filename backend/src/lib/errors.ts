import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { config } from "../config.js";

/**
 * Formato único de error de la API:
 *   { "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }
 */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const badRequest = (code: string, message: string) => new AppError(400, code, message);
export const unauthorized = (message = "Necesitas iniciar sesión.") => new AppError(401, "UNAUTHORIZED", message);
export const forbidden = (message = "No tienes permiso para realizar esta acción.") =>
  new AppError(403, "FORBIDDEN", message);
export const notFound = (message = "Recurso no encontrado.") => new AppError(404, "NOT_FOUND", message);
export const conflict = (code: string, message: string) => new AppError(409, code, message);

export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(notFound("La ruta solicitada no existe."));
};

interface BodyParserError extends Error {
  type?: string;
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: err.issues[0]?.message ?? "Datos inválidos.",
        details: err.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message })),
      },
    });
    return;
  }

  const bodyError = err as BodyParserError;
  if (bodyError.type === "entity.parse.failed") {
    res.status(400).json({ error: { code: "INVALID_JSON", message: "El cuerpo de la petición no es JSON válido." } });
    return;
  }
  if (bodyError.type === "entity.too.large") {
    res.status(413).json({ error: { code: "PAYLOAD_TOO_LARGE", message: "La petición es demasiado grande." } });
    return;
  }

  // Error inesperado: se registra sin el cuerpo de la petición (puede traer
  // contraseñas o montos) y el cliente recibe un mensaje genérico, sin stack.
  const code = (err as { code?: unknown }).code;
  console.error(
    `[error] ${req.method} ${req.originalUrl.split("?")[0]} ${(err as Error)?.name ?? "Error"}${typeof code === "string" ? ` ${code}` : ""}`,
  );
  if (!config.isProduction) console.error((err as Error)?.stack);

  res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Ocurrió un error inesperado. Intenta de nuevo." } });
};
