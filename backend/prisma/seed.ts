/**
 * Datos de demostración (los mismos que tenía el mock-store del frontend).
 * Es idempotente: si los usuarios demo ya existen no duplica grupos ni gastos;
 * solo actualiza su contraseña y completa las amistades demo.
 *
 *   pnpm db:seed
 *
 * Todos los usuarios demo usan la contraseña: Evenly2026!
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { splitEqually } from "../src/lib/money.js";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

const DEMO_PASSWORD = "Evenly2026!";

/** Amistades demo: [solicitante, destinatario, aceptada]. */
const FRIENDSHIPS: [UserKey, UserKey, boolean][] = [
  ["paul", "ana", true],
  ["kevin", "paul", true],
  ["ana", "mariana", true],
  ["mariana", "paul", false],
];

const USERS = [
  { key: "paul", nombre: "Paul Wilson", email: "paul@evenly.app", avatarColor: "pink" },
  { key: "ana", nombre: "Ana López", email: "ana@evenly.app", avatarColor: "sky" },
  { key: "kevin", nombre: "Kevin Rivas", email: "kevin@evenly.app", avatarColor: "ice" },
  { key: "mariana", nombre: "Mariana Ruiz", email: "mariana@evenly.app", avatarColor: "pink" },
] as const;

type UserKey = (typeof USERS)[number]["key"];

const GROUPS: {
  nombre: string;
  categoria: "grupo" | "comida" | "entretenimiento";
  tema: "ice" | "sky" | "pink";
  miembros: UserKey[];
  createdAt: string;
  gastos: { descripcion: string; monto: number; pagador: UserKey; categoria: "grupo" | "comida" | "transporte"; fecha: string }[];
}[] = [
  {
    nombre: "Viaje a la playa",
    categoria: "entretenimiento",
    tema: "sky",
    miembros: ["paul", "ana", "kevin"],
    createdAt: "2026-07-02T10:00:00.000Z",
    gastos: [
      { descripcion: "Hospedaje Airbnb", monto: 240, pagador: "paul", categoria: "grupo", fecha: "2026-08-02T14:30:00.000Z" },
      { descripcion: "Gasolina", monto: 45, pagador: "ana", categoria: "transporte", fecha: "2026-08-03T09:15:00.000Z" },
      { descripcion: "Cena en la playa", monto: 78, pagador: "kevin", categoria: "comida", fecha: "2026-08-04T20:00:00.000Z" },
    ],
  },
  {
    nombre: "Depa compartido",
    categoria: "grupo",
    tema: "ice",
    miembros: ["paul", "ana", "mariana"],
    createdAt: "2026-05-14T10:00:00.000Z",
    gastos: [
      { descripcion: "Renta de agosto", monto: 900, pagador: "paul", categoria: "grupo", fecha: "2026-08-01T08:00:00.000Z" },
      { descripcion: "Supermercado", monto: 62.5, pagador: "mariana", categoria: "comida", fecha: "2026-08-09T18:20:00.000Z" },
    ],
  },
  {
    nombre: "Asado del finde",
    categoria: "comida",
    tema: "pink",
    miembros: ["paul", "kevin", "mariana"],
    createdAt: "2026-08-10T10:00:00.000Z",
    gastos: [
      { descripcion: "Carne y carbón", monto: 54, pagador: "mariana", categoria: "comida", fecha: "2026-08-16T16:00:00.000Z" },
    ],
  },
];

async function ensureFriendships(ids: Record<UserKey, string>) {
  for (const [from, to, accepted] of FRIENDSHIPS) {
    const exists = await prisma.amistad.findFirst({
      where: {
        OR: [
          { solicitanteId: ids[from], destinatarioId: ids[to] },
          { solicitanteId: ids[to], destinatarioId: ids[from] },
        ],
      },
    });
    if (exists) continue;
    await prisma.amistad.create({
      data: {
        solicitanteId: ids[from],
        destinatarioId: ids[to],
        estado: accepted ? "ACEPTADA" : "PENDIENTE",
        ...(accepted && { respondedAt: new Date() }),
      },
    });
  }
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const existing = await prisma.usuario.findMany({ where: { email: { in: USERS.map((u) => u.email) } } });

  if (existing.length > 0) {
    const ids = {} as Record<UserKey, string>;
    for (const u of USERS) {
      const row = existing.find((e) => e.email === u.email);
      if (row) ids[u.key] = row.id;
    }
    await prisma.usuario.updateMany({ where: { id: { in: existing.map((e) => e.id) } }, data: { passwordHash } });
    if (Object.keys(ids).length === USERS.length) await ensureFriendships(ids);
    console.log(`Los datos demo ya existían: contraseña actualizada y amistades completadas. Contraseña demo: ${DEMO_PASSWORD}`);
    return;
  }

  const ids = {} as Record<UserKey, string>;
  for (const u of USERS) {
    const created = await prisma.usuario.create({
      data: { nombre: u.nombre, email: u.email, avatarColor: u.avatarColor, passwordHash },
    });
    ids[u.key] = created.id;
  }
  await ensureFriendships(ids);

  for (const g of GROUPS) {
    const creador = ids[g.miembros[0]!];
    const grupo = await prisma.grupo.create({
      data: {
        nombre: g.nombre,
        categoria: g.categoria,
        tema: g.tema,
        creadoPorId: creador,
        createdAt: new Date(g.createdAt),
        miembros: {
          create: g.miembros.map((key, i) => ({ usuarioId: ids[key], rol: i === 0 ? "ADMIN" : "MIEMBRO" })),
        },
      },
    });

    for (const gasto of g.gastos) {
      const cents = Math.round(gasto.monto * 100);
      const shares = splitEqually(
        cents,
        g.miembros.map((key) => ids[key]),
      );
      await prisma.gasto.create({
        data: {
          grupoId: grupo.id,
          descripcion: gasto.descripcion,
          montoCentavos: cents,
          categoria: gasto.categoria,
          tipoDivision: "equal",
          pagadoPorId: ids[gasto.pagador],
          creadoPorId: ids[gasto.pagador],
          createdAt: new Date(gasto.fecha),
          items: { create: shares.map((s) => ({ usuarioId: s.userId, montoCentavos: s.cents })) },
        },
      });
    }
  }

  console.log(`Seed listo: ${USERS.length} usuarios, ${GROUPS.length} grupos. Contraseña demo: ${DEMO_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error("Error en el seed:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
