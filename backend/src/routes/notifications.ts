import { Router } from "express";
import { addClient, computeCounts, removeClient, send } from "../lib/notificationHub.js";
import { currentUser } from "../middleware/auth.js";

export const notificationsRouter = Router();

const HEARTBEAT_MS = 25_000;

/**
 * GET /notifications — contadores actuales de avisos:
 * - friendRequests: solicitudes de amistad recibidas y pendientes
 * - groupsWithDebt: grupos en los que el usuario debe dinero
 * - totalDebt: cuánto debe en total sumando esos grupos
 */
notificationsRouter.get("/", async (req, res) => {
  res.json(await computeCounts(currentUser(req).id));
});

/**
 * GET /notifications/stream — Server-Sent Events. Al conectar envía los
 * contadores actuales y después, en cuanto cambian, eventos:
 *   event: counts  → { friendRequests, groupsWithDebt, totalDebt }
 *   event: notice  → { kind, message, link? }
 * Requiere el header Authorization (el frontend usa fetch en lugar de
 * EventSource para no poner el token en la URL).
 */
notificationsRouter.get("/stream", async (req, res) => {
  const me = currentUser(req);

  res.status(200).set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    // Evita que proxies (nginx, Render) acumulen la respuesta antes de enviarla.
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders();
  res.write("retry: 5000\n\n");

  addClient(me.id, res);
  send(res, "counts", await computeCounts(me.id));

  // Comentario periódico para que los proxies no cierren la conexión por inactividad.
  const heartbeat = setInterval(() => res.write(": ping\n\n"), HEARTBEAT_MS);

  req.on("close", () => {
    clearInterval(heartbeat);
    removeClient(me.id, res);
  });
});
