import { test as base, expect, type APIRequestContext, type Page } from "@playwright/test"
import { AddExpensePage } from "../pages/add-expense.page"
import { GroupPage } from "../pages/group.page"
import { HomePage } from "../pages/home.page"
import { LoginPage } from "../pages/login.page"

export const API_URL = process.env.API_URL ?? "http://localhost:3000"
export const TEST_PASSWORD = "Prueba2026!"

export interface TestUser {
  id: string
  name: string
  email: string
  token: string
}

/** Datos preparados por API para que cada prueba sea independiente (no depende del seed). */
export class TestData {
  constructor(private readonly request: APIRequestContext) {}

  async user(label: string): Promise<TestUser> {
    const unique = `${Date.now().toString(36)}${Math.floor(Math.random() * 9000 + 1000)}`
    const body = { name: `PW ${label}`, email: `pw.${label.toLowerCase()}.${unique}@evenly.test`, password: TEST_PASSWORD }
    const res = await this.request.post(`${API_URL}/auth/register`, { data: body })
    expect(res.status(), `registro de ${label}`).toBe(201)
    const json = await res.json()
    return { id: json.user.id, name: body.name, email: body.email, token: json.token }
  }

  async group(owner: TestUser, name: string, members: TestUser[]): Promise<string> {
    const res = await this.request.post(`${API_URL}/groups`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: { name, memberIds: members.map((m) => m.id) },
    })
    expect(res.status(), "crear grupo").toBe(201)
    return (await res.json()).group.id
  }

  async equalExpense(payer: TestUser, groupId: string, description: string, amount: number, participants: TestUser[]) {
    const res = await this.request.post(`${API_URL}/groups/${groupId}/expenses`, {
      headers: { Authorization: `Bearer ${payer.token}` },
      data: {
        description,
        amount,
        paidById: payer.id,
        splitType: "equal",
        category: "comida",
        participants: participants.map((p) => ({ userId: p.id })),
      },
    })
    expect(res.status(), "registrar gasto").toBe(201)
  }
}

/** Deja la sesión iniciada en localStorage antes de cargar la app (sin pasar por el login). */
export async function signIn(page: Page, user: TestUser) {
  await page.addInitScript((u) => {
    window.localStorage.setItem(
      "evenly-auth",
      JSON.stringify({ state: { user: { id: u.id, name: u.name, email: u.email, avatarColor: "sky" }, token: u.token }, version: 1 }),
    )
  }, user)
}

type Fixtures = {
  data: TestData
  loginPage: LoginPage
  homePage: HomePage
  groupPage: GroupPage
  addExpensePage: AddExpensePage
}

export const test = base.extend<Fixtures>({
  data: async ({ request }, use) => {
    await use(new TestData(request))
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page))
  },
  homePage: async ({ page }, use) => {
    await use(new HomePage(page))
  },
  groupPage: async ({ page }, use) => {
    await use(new GroupPage(page))
  },
  addExpensePage: async ({ page }, use) => {
    await use(new AddExpensePage(page))
  },
})

export { expect }
