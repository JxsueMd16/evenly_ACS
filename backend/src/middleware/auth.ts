import type { Request, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { unauthorized } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";
import { publicUserSelect } from "../lib/dto.js";

export interface AuthUser {
  id: string;
  nombre: string;
  email: string;
  avatarColor: "ice" | "sky" | "pink";
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function signToken(userId: string): string {
  return jwt.sign({}, config.JWT_SECRET, {
    subject: userId,
    algorithm: "HS256",
    expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] & string,
  });
}

/**
 * Exige un header `Authorization: Bearer <token>` válido. Además del token se
 * verifica que el usuario siga existiendo en la base de datos.
 */
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) throw unauthorized();

  let userId: string | undefined;
  try {
    const payload = jwt.verify(header.slice(7), config.JWT_SECRET, { algorithms: ["HS256"] });
    userId = typeof payload === "object" ? payload.sub : undefined;
  } catch {
    throw unauthorized("Tu sesión expiró o no es válida. Inicia sesión de nuevo.");
  }
  if (!userId) throw unauthorized("Tu sesión expiró o no es válida. Inicia sesión de nuevo.");

  const user = await prisma.usuario.findUnique({ where: { id: userId }, select: publicUserSelect });
  if (!user) throw unauthorized("Tu sesión expiró o no es válida. Inicia sesión de nuevo.");

  req.user = user;
  next();
};

/** Usuario autenticado; solo usar en rutas protegidas con requireAuth. */
export function currentUser(req: Request): AuthUser {
  if (!req.user) throw unauthorized();
  return req.user;
}
