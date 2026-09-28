import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config.js";
import { prisma } from "./lib/prisma.js";
import { errorHandler, notFoundHandler } from "./lib/errors.js";
import { requireAuth } from "./middleware/auth.js";
import { authRouter } from "./routes/auth.js";
import { usersRouter } from "./routes/users.js";
import { groupsRouter } from "./routes/groups.js";
import { expensesRouter } from "./routes/expenses.js";
import { activityRouter } from "./routes/activity.js";
import { friendsRouter } from "./routes/friends.js";
import { invitesRouter } from "./routes/invites.js";
import { notificationsRouter } from "./routes/notifications.js";
import { quickBillsRouter } from "./routes/quickBills.js";
import { paymentsRouter } from "./routes/payments.js";
import { meRouter } from "./routes/me.js";

export const app = express();

// Render/Vercel ponen un proxy delante: necesario para que el rate limit vea la IP real.
app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(helmet());
// En producción solo se aceptan los orígenes de CORS_ORIGIN. En desarrollo
// también cualquier puerto de localhost, porque Vite usa 5174, 5175… si el
// 5173 está ocupado.
const LOCAL_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed =
        !origin || config.corsOrigins.includes(origin) || (!config.isProduction && LOCAL_ORIGIN.test(origin));
      callback(null, allowed);
    },
  }),
);
app.use(express.json({ limit: "100kb" }));

// Log de acceso: método, ruta (sin query string), estado y duración.
// No se registran cuerpos, headers ni parámetros de búsqueda.
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    if (config.NODE_ENV !== "test") {
      console.log(`${req.method} ${req.originalUrl.split("?")[0]} ${res.statusCode} ${Date.now() - start}ms`);
    }
  });
  next();
});

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "ok" });
  } catch {
    res.status(503).json({ status: "degraded", db: "unreachable" });
  }
});

app.use("/auth", authRouter);
app.use("/users", requireAuth, usersRouter);
// Gastos y pagos van antes que grupos para que requireAuth no se ejecute dos veces.
app.use("/groups/:groupId/expenses", requireAuth, expensesRouter);
app.use("/groups/:groupId/payments", requireAuth, paymentsRouter);
app.use("/groups", requireAuth, groupsRouter);
app.use("/activity", requireAuth, activityRouter);
app.use("/friends", requireAuth, friendsRouter);
app.use("/invites", requireAuth, invitesRouter);
app.use("/notifications", requireAuth, notificationsRouter);
app.use("/quick-bills", requireAuth, quickBillsRouter);
app.use("/me", requireAuth, meRouter);

app.use(notFoundHandler);
app.use(errorHandler);
