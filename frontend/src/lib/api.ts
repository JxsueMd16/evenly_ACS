import type { CategoryId } from "./categories"
import type {
  ActivityItem,
  Expense,
  ExpenseParticipant,
  FriendshipStatus,
  FriendsOverview,
  Group,
  GroupDetail,
  InvitePreview,
  BankAccount,
  Payment,
  PaymentInfo,
  PaymentMethod,
  PaymentPreference,
  SplitType,
  User,
  UserSearchResult,
} from "./types"
import { useAuthStore } from "@/store/authStore"

/**
 * Cliente HTTP del backend de Evenly (reemplaza al antiguo mockApi.ts).
 * Todas las funciones lanzan ApiError con un mensaje listo para mostrar.
 */
export const API_BASE_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/$/, "")

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE"
  body?: unknown
  /** Cuerpo binario (por ejemplo una imagen) en lugar de JSON. */
  file?: Blob
  /** false para login/registro, que no llevan token. */
  auth?: boolean
  /** "blob" para descargar archivos (comprobantes). */
  responseType?: "json" | "blob"
}

async function request<T>(
  path: string,
  { method = "GET", body, file, auth = true, responseType = "json" }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {}
  if (body !== undefined) headers["Content-Type"] = "application/json"
  if (file) headers["Content-Type"] = file.type

  const token = useAuthStore.getState().token
  if (auth && token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: file ?? (body === undefined ? undefined : JSON.stringify(body)),
    })
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.")
  }

  if (response.status === 204) return undefined as T
  if (response.ok && responseType === "blob") return (await response.blob()) as T

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const code: string = data?.error?.code ?? "UNKNOWN_ERROR"
    const message: string = data?.error?.message ?? "Ocurrió un error inesperado. Intenta de nuevo."
    // Token vencido o inválido: se cierra la sesión y ProtectedRoute manda a /login.
    if (response.status === 401 && auth && token) useAuthStore.getState().logout()
    throw new ApiError(response.status, code, message)
  }

  return data as T
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface AuthResponse {
  token: string
  user: User
}

export function loginRequest(email: string, password: string) {
  return request<AuthResponse>("/auth/login", { method: "POST", body: { email, password }, auth: false })
}

export function registerRequest(name: string, email: string, password: string) {
  return request<AuthResponse>("/auth/register", { method: "POST", body: { name, email, password }, auth: false })
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export async function searchUsers(search: string): Promise<UserSearchResult[]> {
  const data = await request<{ users: UserSearchResult[] }>(`/users?search=${encodeURIComponent(search)}`)
  return data.users
}

// ---------------------------------------------------------------------------
// Friends
// ---------------------------------------------------------------------------

export function getFriends() {
  return request<FriendsOverview>("/friends")
}

/** Envía una solicitud; si el otro ya había enviado una, quedan como amigos directamente. */
export async function sendFriendRequest(userId: string): Promise<FriendshipStatus> {
  const data = await request<{ status: FriendshipStatus }>("/friends/requests", { method: "POST", body: { userId } })
  return data.status
}

export function acceptFriendRequest(requestId: string) {
  return request<{ status: FriendshipStatus }>(`/friends/requests/${encodeURIComponent(requestId)}/accept`, {
    method: "POST",
  })
}

/** Rechaza una solicitud recibida o cancela una enviada. */
export function deleteFriendRequest(requestId: string) {
  return request<void>(`/friends/requests/${encodeURIComponent(requestId)}`, { method: "DELETE" })
}

export function removeFriend(userId: string) {
  return request<void>(`/friends/${encodeURIComponent(userId)}`, { method: "DELETE" })
}

// ---------------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------------

export async function getGroups(): Promise<Group[]> {
  const data = await request<{ groups: Group[] }>("/groups")
  return data.groups
}

/** Devuelve null si el grupo no existe o el usuario no pertenece a él. */
export async function getGroup(groupId: string): Promise<GroupDetail | null> {
  try {
    const data = await request<{ group: GroupDetail }>(`/groups/${encodeURIComponent(groupId)}`)
    return data.group
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null
    throw err
  }
}

export async function createGroup(name: string, category: CategoryId, memberIds: string[]): Promise<GroupDetail> {
  const data = await request<{ group: GroupDetail }>("/groups", {
    method: "POST",
    body: { name, category, memberIds },
  })
  return data.group
}

export interface UpdateGroupInput {
  name?: string
  category?: CategoryId
}

/** Solo el administrador del grupo. */
export async function updateGroup(groupId: string, input: UpdateGroupInput): Promise<GroupDetail> {
  const data = await request<{ group: GroupDetail }>(`/groups/${encodeURIComponent(groupId)}`, {
    method: "PATCH",
    body: input,
  })
  return data.group
}

/** Solo el administrador; borra también los gastos del grupo. */
export function deleteGroup(groupId: string) {
  return request<void>(`/groups/${encodeURIComponent(groupId)}`, { method: "DELETE" })
}

export async function addMember(groupId: string, userId: string): Promise<GroupDetail> {
  const data = await request<{ group: GroupDetail }>(`/groups/${encodeURIComponent(groupId)}/members`, {
    method: "POST",
    body: { userId },
  })
  return data.group
}

/** El admin quita a otro integrante, o un integrante sale del grupo (userId = el suyo). */
export function removeMember(groupId: string, userId: string) {
  return request<void>(`/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(userId)}`, {
    method: "DELETE",
  })
}

// ---------------------------------------------------------------------------
// Invitaciones por enlace
// ---------------------------------------------------------------------------

/** URL que se comparte: abre /join/<código> en este mismo frontend. */
export const inviteUrl = (code: string) => `${window.location.origin}/join/${code}`

export async function getInviteCode(groupId: string): Promise<string> {
  const data = await request<{ code: string }>(`/groups/${encodeURIComponent(groupId)}/invite`)
  return data.code
}

/** Solo el admin: genera un código nuevo y el enlace anterior deja de funcionar. */
export async function regenerateInviteCode(groupId: string): Promise<string> {
  const data = await request<{ code: string }>(`/groups/${encodeURIComponent(groupId)}/invite`, { method: "POST" })
  return data.code
}

export function getInvitePreview(code: string) {
  return request<InvitePreview>(`/invites/${encodeURIComponent(code)}`)
}

export function joinByInvite(code: string) {
  return request<{ groupId: string; alreadyMember: boolean }>(`/invites/${encodeURIComponent(code)}/join`, {
    method: "POST",
  })
}

// ---------------------------------------------------------------------------
// Expenses
// ---------------------------------------------------------------------------

export async function getExpensesForGroup(groupId: string): Promise<Expense[]> {
  const data = await request<{ expenses: Expense[] }>(`/groups/${encodeURIComponent(groupId)}/expenses`)
  return data.expenses
}

/** Datos de una cuenta nueva (el total sale de los ítems o de `amount` si no hay ítems). */
export interface BillInput {
  description: string
  category: CategoryId
  paidById: string
  splitType: SplitType
  amount?: number
  lines: {
    description: string
    quantity: number
    unitPrice: number
    shared: boolean
    assignments: { userId: string; quantity: number }[]
  }[]
  /** El servidor calcula la parte de cada quien; `amount` solo en división "itemized". */
  participants: (Pick<ExpenseParticipant, "userId"> & Partial<Pick<ExpenseParticipant, "amount">>)[]
}

export interface AddExpenseInput extends BillInput {
  groupId: string
}

/** Cuenta rápida: sin grupo previo. Devuelve el grupo (rápido) creado para ella. */
export function createQuickBill(participantIds: string[], bill: BillInput) {
  return request<{ groupId: string; expense: Expense }>("/quick-bills", {
    method: "POST",
    body: { participantIds, bill },
  })
}

export async function addExpense({ groupId, ...body }: AddExpenseInput): Promise<Expense> {
  const data = await request<{ expense: Expense }>(`/groups/${encodeURIComponent(groupId)}/expenses`, {
    method: "POST",
    body,
  })
  return data.expense
}

/** Quien lo registró, quien lo pagó o el administrador del grupo. */
export function deleteExpense(groupId: string, expenseId: string) {
  return request<void>(
    `/groups/${encodeURIComponent(groupId)}/expenses/${encodeURIComponent(expenseId)}`,
    { method: "DELETE" },
  )
}

// ---------------------------------------------------------------------------
// Pagos entre integrantes y datos bancarios
// ---------------------------------------------------------------------------

export function getPaymentProfile() {
  return request<{ preference: PaymentPreference; accounts: BankAccount[] }>("/me/payment-profile")
}

export function updatePaymentPreference(preference: PaymentPreference) {
  return request<{ preference: PaymentPreference }>("/me/payment-profile", { method: "PATCH", body: { preference } })
}

export type BankAccountInput = Omit<BankAccount, "id">

export async function addBankAccount(input: BankAccountInput): Promise<BankAccount> {
  const data = await request<{ account: BankAccount }>("/me/bank-accounts", { method: "POST", body: input })
  return data.account
}

export async function updateBankAccount(id: string, input: Partial<BankAccountInput>): Promise<BankAccount> {
  const data = await request<{ account: BankAccount }>(`/me/bank-accounts/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: input,
  })
  return data.account
}

export function deleteBankAccount(id: string) {
  return request<void>(`/me/bank-accounts/${encodeURIComponent(id)}`, { method: "DELETE" })
}

/** Preferencia y cuentas visibles de otro usuario (si comparten grupo o amistad). */
export function getUserPaymentInfo(userId: string) {
  return request<PaymentInfo>(`/users/${encodeURIComponent(userId)}/payment-info`)
}

const paymentsPath = (groupId: string) => `/groups/${encodeURIComponent(groupId)}/payments`

export async function getPayments(groupId: string): Promise<Payment[]> {
  const data = await request<{ payments: Payment[] }>(paymentsPath(groupId))
  return data.payments
}

export async function createPayment(
  groupId: string,
  input: { toUserId: string; amount: number; method: PaymentMethod; note?: string },
): Promise<Payment> {
  const data = await request<{ payment: Payment }>(paymentsPath(groupId), { method: "POST", body: input })
  return data.payment
}

export function uploadPaymentEvidence(groupId: string, paymentId: string, image: Blob) {
  return request<void>(`${paymentsPath(groupId)}/${encodeURIComponent(paymentId)}/evidence`, {
    method: "POST",
    file: image,
  })
}

export function getPaymentEvidence(groupId: string, paymentId: string) {
  return request<Blob>(`${paymentsPath(groupId)}/${encodeURIComponent(paymentId)}/evidence`, { responseType: "blob" })
}

export function respondToPayment(groupId: string, paymentId: string, action: "confirm" | "reject") {
  return request<{ payment: Payment }>(`${paymentsPath(groupId)}/${encodeURIComponent(paymentId)}/${action}`, {
    method: "POST",
  })
}

export function cancelPayment(groupId: string, paymentId: string) {
  return request<void>(`${paymentsPath(groupId)}/${encodeURIComponent(paymentId)}`, { method: "DELETE" })
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export interface NotificationCounts {
  friendRequests: number
  groupsWithDebt: number
  totalDebt: number
  /** Pagos que otros registraron a tu favor y esperan tu confirmación. */
  paymentsToConfirm: number
}

// ---------------------------------------------------------------------------
// Activity
// ---------------------------------------------------------------------------

export async function getRecentActivity(limit = 20): Promise<ActivityItem[]> {
  const data = await request<{ items: ActivityItem[] }>(`/activity?limit=${limit}`)
  return data.items
}

/** Gastos que el usuario pagó, en todos sus grupos. */
export async function getPaymentHistory(): Promise<ActivityItem[]> {
  const data = await request<{ items: ActivityItem[] }>("/activity?paidByMe=true&limit=50")
  return data.items
}

// ---------------------------------------------------------------------------
// Balances
// ---------------------------------------------------------------------------

/** Balance total del usuario sumando todos sus grupos (positivo = te deben). */
export function overallBalance(groups: Group[]): number {
  const cents = groups.reduce((sum, g) => sum + Math.round(g.myBalance * 100), 0)
  return cents / 100
}
