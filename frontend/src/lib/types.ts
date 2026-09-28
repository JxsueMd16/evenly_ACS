import type { CategoryId } from "./categories"

// Espejo de las respuestas del backend (docs/api/openapi.yaml).

export type ThemeColor = "ice" | "sky" | "pink"

export interface User {
  id: string
  name: string
  email: string
  avatarColor: ThemeColor
}

export interface GroupMember extends User {
  role: "ADMIN" | "MIEMBRO"
}

/** equal: partes iguales · items: cada quien paga lo que consumió · itemized: montos manuales */
export type SplitType = "equal" | "items" | "itemized"

/** Línea del detalle de una cuenta: "2 × Churrasco a 25.00". */
export interface BillLine {
  id: string
  description: string
  quantity: number
  unitPrice: number
  subtotal: number
  /** Compartido: el subtotal se divide en partes iguales entre quienes lo consumieron. */
  shared: boolean
  assignments: { userId: string; quantity: number }[]
}

export interface ExpenseParticipant {
  userId: string
  amount: number
}

export interface Expense {
  id: string
  groupId: string
  description: string
  amount: number
  paidById: string
  paidBy: User
  splitType: SplitType
  participants: ExpenseParticipant[]
  lines: BillLine[]
  category: CategoryId
  createdById: string
  createdAt: string
}

export interface Group {
  id: string
  name: string
  category: CategoryId
  theme: ThemeColor
  /** Cuenta rápida: grupo creado automáticamente para una sola cuenta. */
  isQuick: boolean
  createdById: string
  createdAt: string
  memberIds: string[]
  members: GroupMember[]
  /** positive: the current user is owed money; negative: the current user owes money */
  myBalance: number
  expenseCount: number
  totalSpent: number
}

export interface MemberBalance {
  userId: string
  /** positive: this member is owed money; negative: this member owes money */
  net: number
}

export interface Settlement {
  fromUserId: string
  toUserId: string
  amount: number
}

export interface GroupDetail extends Group {
  balances: MemberBalance[]
  settlements: Settlement[]
}

export interface ActivityItem {
  expense: Expense
  group: Pick<Group, "id" | "name" | "category" | "theme">
}

export type FriendshipStatus = "none" | "friends" | "outgoing" | "incoming"

/** Resultado de búsqueda de usuarios, con la relación de amistad con el usuario actual. */
export interface UserSearchResult extends User {
  friendship: FriendshipStatus
  /** Id de la solicitud pendiente (para aceptar, rechazar o cancelar). */
  requestId: string | null
}

export interface FriendRequest {
  id: string
  user: User
  createdAt: string
}

export interface FriendsOverview {
  friends: User[]
  incoming: FriendRequest[]
  outgoing: FriendRequest[]
}

export interface InvitePreview {
  group: Pick<Group, "id" | "name" | "category" | "theme"> & { memberCount: number; memberNames: string[] }
  alreadyMember: boolean
}

export type PaymentPreference = "EFECTIVO" | "TRANSFERENCIA" | "AMBOS"
export type PaymentMethod = "EFECTIVO" | "TRANSFERENCIA"

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
] as const

export interface BankAccount {
  id: string
  bank: (typeof BANKS)[number]
  type: "MONETARIA" | "AHORRO"
  number: string
  holder: string
  /** Visible para quienes comparten un grupo o una amistad contigo. */
  visible: boolean
}

export interface PaymentInfo {
  userId: string
  name: string
  preference: PaymentPreference
  accounts: BankAccount[]
}

/** PENDIENTE: registrado por quien debe · CONFIRMADO: quien recibe confirmó · RECHAZADO: no lo recibió. */
export interface Payment {
  id: string
  groupId: string
  fromUserId: string
  toUserId: string
  amount: number
  method: PaymentMethod
  note: string | null
  status: "PENDIENTE" | "CONFIRMADO" | "RECHAZADO"
  hasEvidence: boolean
  createdAt: string
  respondedAt: string | null
}
