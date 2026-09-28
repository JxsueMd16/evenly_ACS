import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { config } from "../config.js";
import { prisma } from "../lib/prisma.js";
import { conflict, unauthorized } from "../lib/errors.js";
import { loginSchema, registerSchema } from "../lib/schemas.js";
import { publicUserSelect, toUserDto } from "../lib/dto.js";
import { currentUser, requireAuth, signToken } from "../middleware/auth.js";

export const authRouter = Router();

const BCRYPT_ROUNDS = 10;
const AVATAR_COLORS = ["ice", "sky", "pink"] as const;
const INVALID_CREDENTIALS = "Correo o contraseña incorrectos.";

// Hash de una contraseña aleatoria: se compara contra él cuando el correo no
// existe, para que la respuesta tarde lo mismo exista o no la cuenta.
const DUMMY_HASH = bcrypt.hashSync("evenly-dummy-password", BCRYPT_ROUNDS);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.AUTH_RATE_LIMIT,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: { code: "TOO_MANY_REQUESTS", message: "Demasiados intentos. Espera unos minutos." } },
});

authRouter.post("/register", authLimiter, async (req, res) => {
  const input = registerSchema.parse(req.body);

  const existing = await prisma.usuario.findUnique({ where: { email: input.email }, select: { id: true } });
  if (existing) throw conflict("EMAIL_TAKEN", "Ya existe una cuenta con ese correo.");

  const colorIndex = [...input.email].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % AVATAR_COLORS.length;
  const user = await prisma.usuario.create({
    data: {
      nombre: input.name,
      email: input.email,
      passwordHash: await bcrypt.hash(input.password, BCRYPT_ROUNDS),
      avatarColor: AVATAR_COLORS[colorIndex]!,
    },
    select: publicUserSelect,
  });

  res.status(201).json({ token: signToken(user.id), user: toUserDto(user) });
});

authRouter.post("/login", authLimiter, async (req, res) => {
  const input = loginSchema.parse(req.body);

  const user = await prisma.usuario.findUnique({ where: { email: input.email } });
  const passwordOk = await bcrypt.compare(input.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !passwordOk) throw unauthorized(INVALID_CREDENTIALS);

  res.json({ token: signToken(user.id), user: toUserDto(user) });
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: toUserDto(currentUser(req)) });
});
