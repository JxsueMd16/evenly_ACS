/**
 * Validación de entradas con zod. Los objetos son estrictos: campos no
 * esperados (p. ej. "creadoPorId" o "passwordHash") se rechazan con 400.
 */
import { z } from "zod";
import { hasAtMostTwoDecimals, MAX_AMOUNT } from "./money.js";

z.config(z.locales.es());

const CATEGORIES = ["grupo", "comida", "amigos", "transporte", "entretenimiento"] as const;
const THEMES = ["ice", "sky", "pink"] as const;

/** IDs generados por Prisma (cuid): solo letras y números. */
export const idSchema = z.string().regex(/^[a-z0-9]{10,40}$/i, "Identificador inválido.");

const trimmedText = (field: string, max: number) =>
  z
    .string({ error: `${field} es obligatorio.` })
    .trim()
    .min(1, `${field} es obligatorio.`)
    .max(max, `${field} no puede tener más de ${max} caracteres.`);

/**
 * Monto en la moneda del usuario. Debe ser un número JSON (no un string):
 * "100", "1e3" como texto, "10; DROP TABLE" o NaN se rechazan.
 */
export const amountSchema = z
  .number({ error: "El monto debe ser un número." })
  .refine(Number.isFinite, "El monto debe ser un número.")
  .refine((n) => n > 0, "El monto debe ser mayor a 0.")
  .refine((n) => n <= MAX_AMOUNT, `El monto no puede ser mayor a ${MAX_AMOUNT.toLocaleString("en-US")}.`)
  .refine(hasAtMostTwoDecimals, "El monto admite como máximo 2 decimales.");

const emailSchema = z
  .string({ error: "El correo es obligatorio." })
  .trim()
  .toLowerCase()
  .max(254, "El correo es demasiado largo.")
  .pipe(z.email("Ingresa un correo válido."));

/**
 * Política de contraseñas (la misma que muestra el registro en el frontend):
 * 8 a 72 caracteres (72 es el límite de bcrypt), con al menos una minúscula,
 * una mayúscula, un número y un símbolo.
 */
export const passwordSchema = z
  .string({ error: "La contraseña es obligatoria." })
  .min(8, "La contraseña debe tener al menos 8 caracteres.")
  .max(72, "La contraseña no puede tener más de 72 caracteres.")
  .regex(/[a-z]/, "La contraseña debe incluir al menos una letra minúscula.")
  .regex(/[A-Z]/, "La contraseña debe incluir al menos una letra mayúscula.")
  .regex(/[0-9]/, "La contraseña debe incluir al menos un número.")
  .regex(/[^A-Za-z0-9]/, "La contraseña debe incluir al menos un símbolo (por ejemplo ! @ # $ %).");

export const registerSchema = z.strictObject({
  name: trimmedText("El nombre", 60),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.strictObject({
  email: emailSchema,
  password: z.string({ error: "La contraseña es obligatoria." }).min(1, "La contraseña es obligatoria.").max(200),
});

export const userSearchSchema = z.strictObject({
  search: z
    .string({ error: "Escribe al menos 2 caracteres para buscar." })
    .trim()
    .min(2, "Escribe al menos 2 caracteres para buscar.")
    .max(50, "La búsqueda no puede tener más de 50 caracteres."),
});

export const createGroupSchema = z.strictObject({
  name: trimmedText("El nombre del grupo", 60),
  category: z.enum(CATEGORIES).default("grupo"),
  theme: z.enum(THEMES).optional(),
  memberIds: z
    .array(idSchema)
    .max(20, "Un grupo puede tener como máximo 20 integrantes.")
    .default([]),
});

export const updateGroupSchema = z
  .strictObject({
    name: trimmedText("El nombre del grupo", 60).optional(),
    category: z.enum(CATEGORIES).optional(),
    theme: z.enum(THEMES).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, "Envía al menos un campo para actualizar.");

export const addMemberSchema = z.strictObject({ userId: idSchema });

const billLineSchema = z.strictObject({
  description: trimmedText("La descripción del ítem", 60),
  quantity: z
    .number({ error: "La cantidad debe ser un número." })
    .int("La cantidad debe ser un número entero.")
    .min(1, "La cantidad debe ser al menos 1.")
    .max(999, "La cantidad no puede ser mayor a 999."),
  unitPrice: amountSchema,
  /** Compartido: el subtotal se divide en partes iguales entre quienes lo consumieron. */
  shared: z.boolean().default(false),
  /** Quién consumió cuántas unidades (solo en división por ítems). */
  assignments: z
    .array(
      z.strictObject({
        userId: idSchema,
        quantity: z.number().int().min(1).max(999).default(1),
      }),
    )
    .max(50)
    .default([]),
});

/**
 * Cuenta (gasto) de un grupo. El total sale de la suma de los ítems; si la
 * cuenta no tiene ítems (por ejemplo, un taxi) se envía `amount`.
 */
export const createExpenseSchema = z.strictObject({
  description: trimmedText("El nombre de la cuenta", 100),
  amount: amountSchema.optional(),
  paidById: idSchema,
  splitType: z.enum(["equal", "items", "itemized"]),
  category: z.enum(CATEGORIES).default("grupo"),
  lines: z.array(billLineSchema).max(50, "Una cuenta puede tener como máximo 50 ítems.").default([]),
  participants: z
    .array(
      z.strictObject({
        userId: idSchema,
        // Solo en división "itemized" (montos manuales); en las demás se ignora.
        amount: amountSchema.optional(),
      }),
    )
    .min(1, "Selecciona al menos un participante.")
    .max(50),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

/** Cuenta rápida: sin grupo previo; se crea uno oculto con las personas elegidas. */
export const quickBillSchema = z.strictObject({
  participantIds: z
    .array(idSchema)
    .min(1, "Agrega al menos a una persona a la cuenta.")
    .max(19, "Una cuenta rápida puede tener como máximo 20 personas."),
  bill: createExpenseSchema,
});

export const activityQuerySchema = z.strictObject({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  paidByMe: z.enum(["true", "false"]).default("false"),
});

export const friendRequestSchema = z.strictObject({ userId: idSchema });

/** Código del enlace de invitación a un grupo. */
export const inviteCodeSchema = z.string().regex(/^[A-Za-z0-9_-]{8,32}$/, "Enlace de invitación inválido.");

/** Bancos de Guatemala disponibles al registrar una cuenta. */
export const BANKS = [
  "Banrural",
  "Banco Industrial",
  "BAC Credomatic",
  "BAM",
  "G&T Continental",
  "Promerica",
  "Bantrab",
  "Banco Internacional",
  "Ficohsa",
  "Otro",
] as const;

export const paymentPreferenceSchema = z.strictObject({
  preference: z.enum(["EFECTIVO", "TRANSFERENCIA", "AMBOS"], { error: "Elige efectivo, transferencia o ambos." }),
});

export const bankAccountSchema = z.strictObject({
  bank: z.enum(BANKS, { error: "Elige un banco de la lista." }),
  type: z.enum(["MONETARIA", "AHORRO"], { error: "Elige si la cuenta es monetaria o de ahorro." }),
  number: z
    .string({ error: "El número de cuenta es obligatorio." })
    .trim()
    .regex(/^[0-9][0-9-]{3,29}$/, "El número de cuenta solo puede tener dígitos y guiones (4 a 30)."),
  holder: trimmedText("El nombre del titular", 80),
  visible: z.boolean().default(true),
});

export const updateBankAccountSchema = bankAccountSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, "Envía al menos un campo para actualizar.");

export const createPaymentSchema = z.strictObject({
  toUserId: idSchema,
  amount: amountSchema,
  method: z.enum(["EFECTIVO", "TRANSFERENCIA"], { error: "Indica si pagaste en efectivo o por transferencia." }),
  note: z.string().trim().max(200, "La nota no puede tener más de 200 caracteres.").optional(),
});
