import type { CategoryId } from "./categories"
import type { Expense, ExpenseParticipant, Group, MemberBalance, SplitType, User } from "./types"

/**
 * Mock backend for Evenly.
 *
 * The real backend (backend/src/index.ts) only exposes GET /health today —
 * there are no /auth, /groups or /expenses routes yet, and the Prisma
 * `Usuario` model only has { id, email, nombre, createdAt } (no password,
 * no groups/expenses tables). Everything below simulates those endpoints
 * in-memory so the UI is fully clickable while the backend catches up.
 *
 * TODO(backend): once real routes exist, replace each function body here
 * with a `fetch(`${API_BASE_URL}/...`)` call and delete the in-memory
 * arrays. Keep the function signatures the same so screens don't change.
 */
export const API_BASE_URL = "http://localhost:3000"

function delay<T>(value: T, ms = 500): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const users: User[] = [
  { id: "u1", name: "Paul Wilson", email: "paul@evenly.app", avatarColor: "pink" },
  { id: "u2", name: "Ana López", email: "ana@evenly.app", avatarColor: "sky" },
  { id: "u3", name: "Kevin Rivas", email: "kevin@evenly.app", avatarColor: "ice" },
  { id: "u4", name: "Mariana Ruiz", email: "mariana@evenly.app", avatarColor: "pink" },
]

const groups: Group[] = [
  {
    id: "g1",
    name: "Viaje a la playa",
    category: "entretenimiento",
    theme: "sky",
    memberIds: ["u1", "u2", "u3"],
    createdAt: "2026-07-02T10:00:00.000Z",
  },
  {
    id: "g2",
    name: "Depa compartido",
    category: "grupo",
    theme: "ice",
    memberIds: ["u1", "u2", "u4"],
    createdAt: "2026-05-14T10:00:00.000Z",
  },
  {
    id: "g3",
    name: "Asado del finde",
    category: "comida",
    theme: "pink",
    memberIds: ["u1", "u3", "u4"],
    createdAt: "2026-08-10T10:00:00.000Z",
  },
]

function equalSplit(amount: number, memberIds: string[]): ExpenseParticipant[] {
  const share = Math.round((amount / memberIds.length) * 100) / 100
  return memberIds.map((userId) => ({ userId, amount: share }))
}

const expenses: Expense[] = [
  {
    id: "e1",
    groupId: "g1",
    description: "Hospedaje Airbnb",
    amount: 240,
    paidById: "u1",
    splitType: "equal",
    participants: equalSplit(240, ["u1", "u2", "u3"]),
    category: "grupo",
    createdAt: "2026-08-02T14:30:00.000Z",
  },
  {
    id: "e2",
    groupId: "g1",
    description: "Gasolina",
    amount: 45,
    paidById: "u2",
    splitType: "equal",
    participants: equalSplit(45, ["u1", "u2", "u3"]),
    category: "transporte",
    createdAt: "2026-08-03T09:15:00.000Z",
  },
  {
    id: "e3",
    groupId: "g1",
    description: "Cena en la playa",
    amount: 78,
    paidById: "u3",
    splitType: "equal",
    participants: equalSplit(78, ["u1", "u2", "u3"]),
    category: "comida",
    createdAt: "2026-08-04T20:00:00.000Z",
  },
  {
    id: "e4",
    groupId: "g2",
    description: "Renta de agosto",
    amount: 900,
    paidById: "u1",
    splitType: "equal",
    participants: equalSplit(900, ["u1", "u2", "u4"]),
    category: "grupo",
    createdAt: "2026-08-01T08:00:00.000Z",
  },
  {
    id: "e5",
    groupId: "g2",
    description: "Supermercado",
    amount: 62.5,
    paidById: "u4",
    splitType: "equal",
    participants: equalSplit(62.5, ["u1", "u2", "u4"]),
    category: "comida",
    createdAt: "2026-08-09T18:20:00.000Z",
  },
  {
    id: "e6",
    groupId: "g3",
    description: "Carne y carbón",
    amount: 54,
    paidById: "u4",
    splitType: "equal",
    participants: equalSplit(54, ["u1", "u3", "u4"]),
    category: "comida",
    createdAt: "2026-08-16T16:00:00.000Z",
  },
]

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

/** TODO(backend): POST `${API_BASE_URL}/auth/login` */
export async function loginRequest(email: string, password: string): Promise<User> {
  if (!password || password.length < 4) {
    return Promise.reject(new Error("La contraseña debe tener al menos 4 caracteres."))
  }
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase())
  if (!user) {
    return delay(null, 500).then(() => {
      throw new Error("No encontramos una cuenta con ese correo.")
    })
  }
  return delay(user, 500)
}

/** TODO(backend): POST `${API_BASE_URL}/auth/register` (maps to Prisma `Usuario`) */
export async function registerRequest(name: string, email: string, password: string): Promise<User> {
  if (!name.trim()) return Promise.reject(new Error("Ingresa tu nombre."))
  if (password.length < 4) {
    return Promise.reject(new Error("La contraseña debe tener al menos 4 caracteres."))
  }
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return delay(null, 500).then(() => {
      throw new Error("Ya existe una cuenta con ese correo.")
    })
  }
  const colors = ["ice", "sky", "pink"] as const
  const newUser: User = {
    id: uid("u"),
    name: name.trim(),
    email: email.trim(),
    avatarColor: colors[users.length % colors.length],
  }
  users.push(newUser)
  return delay(newUser, 500)
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export async function getUserById(userId: string): Promise<User | undefined> {
  return delay(users.find((u) => u.id === userId), 150)
}

export function getUserByIdSync(userId: string): User | undefined {
  return users.find((u) => u.id === userId)
}

/** All known users, for picking group members. TODO(backend): GET `${API_BASE_URL}/users` */
export function getAllUsers(): User[] {
  return users
}

// ---------------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------------

/** TODO(backend): GET `${API_BASE_URL}/groups?userId=...` */
export async function getGroupsForUser(userId: string): Promise<Group[]> {
  return delay(
    groups
      .filter((g) => g.memberIds.includes(userId))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    400,
  )
}

/** TODO(backend): GET `${API_BASE_URL}/groups/:id` */
export async function getGroup(groupId: string): Promise<Group | undefined> {
  return delay(groups.find((g) => g.id === groupId), 300)
}

export function getGroupMembers(group: Group): User[] {
  return group.memberIds
    .map((id) => users.find((u) => u.id === id))
    .filter((u): u is User => Boolean(u))
}

/** TODO(backend): POST `${API_BASE_URL}/groups` */
export async function createGroup(name: string, category: CategoryId, memberIds: string[]): Promise<Group> {
  if (!name.trim()) return Promise.reject(new Error("Ponle un nombre al grupo."))
  const themes = ["ice", "sky", "pink"] as const
  const group: Group = {
    id: uid("g"),
    name: name.trim(),
    category,
    theme: themes[groups.length % themes.length],
    memberIds,
    createdAt: new Date().toISOString(),
  }
  groups.push(group)
  return delay(group, 400)
}

// ---------------------------------------------------------------------------
// Expenses
// ---------------------------------------------------------------------------

/** TODO(backend): GET `${API_BASE_URL}/groups/:id/expenses` */
export async function getExpensesForGroup(groupId: string): Promise<Expense[]> {
  return delay(
    expenses
      .filter((e) => e.groupId === groupId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    400,
  )
}

export interface AddExpenseInput {
  groupId: string
  description: string
  amount: number
  paidById: string
  splitType: SplitType
  participants: ExpenseParticipant[]
  category: CategoryId
}

/** TODO(backend): POST `${API_BASE_URL}/groups/:id/expenses` */
export async function addExpense(input: AddExpenseInput): Promise<Expense> {
  if (!input.description.trim()) {
    return Promise.reject(new Error("Agrega una descripción para el gasto."))
  }
  if (!input.amount || input.amount <= 0) {
    return Promise.reject(new Error("El monto debe ser mayor a 0."))
  }
  const totalSplit = input.participants.reduce((sum, p) => sum + p.amount, 0)
  if (Math.abs(totalSplit - input.amount) > 0.05) {
    return Promise.reject(new Error("La división no suma el total del gasto."))
  }
  const expense: Expense = {
    id: uid("e"),
    groupId: input.groupId,
    description: input.description.trim(),
    amount: input.amount,
    paidById: input.paidById,
    splitType: input.splitType,
    participants: input.participants,
    category: input.category,
    createdAt: new Date().toISOString(),
  }
  expenses.push(expense)
  return delay(expense, 500)
}

// ---------------------------------------------------------------------------
// Balances
// ---------------------------------------------------------------------------

/** Net balance per member within a single group (positive = is owed money). */
export function computeGroupBalances(groupId: string): MemberBalance[] {
  const groupExpenses = expenses.filter((e) => e.groupId === groupId)
  const net = new Map<string, number>()
  for (const expense of groupExpenses) {
    net.set(expense.paidById, (net.get(expense.paidById) ?? 0) + expense.amount)
    for (const participant of expense.participants) {
      net.set(participant.userId, (net.get(participant.userId) ?? 0) - participant.amount)
    }
  }
  return Array.from(net.entries()).map(([userId, value]) => ({
    userId,
    net: Math.round(value * 100) / 100,
  }))
}

/** This user's net position (positive = te deben, negative = debes) across every group they belong to. */
export function computeUserNetByGroup(userId: string): Record<string, number> {
  const result: Record<string, number> = {}
  for (const group of groups) {
    if (!group.memberIds.includes(userId)) continue
    const balances = computeGroupBalances(group.id)
    result[group.id] = balances.find((b) => b.userId === userId)?.net ?? 0
  }
  return result
}

export function computeUserOverallBalance(userId: string): number {
  const byGroup = computeUserNetByGroup(userId)
  return Math.round(Object.values(byGroup).reduce((sum, v) => sum + v, 0) * 100) / 100
}

export interface ActivityItem {
  expense: Expense
  group: Group
}

/** Expenses this user has personally paid for, across every group. */
export async function getPaymentHistory(userId: string): Promise<ActivityItem[]> {
  const myGroups = groups.filter((g) => g.memberIds.includes(userId))
  const items = expenses
    .filter((e) => e.paidById === userId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map((expense) => ({
      expense,
      group: myGroups.find((g) => g.id === expense.groupId)!,
    }))
  return delay(items, 400)
}

export async function getRecentActivity(userId: string, limit = 10): Promise<ActivityItem[]> {
  const myGroups = groups.filter((g) => g.memberIds.includes(userId))
  const myGroupIds = new Set(myGroups.map((g) => g.id))
  const items = expenses
    .filter((e) => myGroupIds.has(e.groupId))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, limit)
    .map((expense) => ({
      expense,
      group: myGroups.find((g) => g.id === expense.groupId)!,
    }))
  return delay(items, 400)
}
