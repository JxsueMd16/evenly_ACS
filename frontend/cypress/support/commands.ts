/// <reference types="cypress" />

export interface TestUser {
  id: string
  name: string
  email: string
  password: string
  token: string
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /** Registra un usuario nuevo por API y devuelve sus datos y token. */
      registerByApi(label: string): Chainable<TestUser>
      /** Deja la sesión iniciada en localStorage sin pasar por la pantalla de login. */
      loginAs(user: TestUser): Chainable<void>
      /** Crea un grupo por API con el usuario dado como admin. */
      createGroupByApi(owner: TestUser, name: string, memberIds: string[]): Chainable<{ id: string }>
      /** Deja a los dos usuarios como amigos (solicitud de `a` aceptada por `b`). */
      befriendByApi(a: TestUser, b: TestUser): Chainable<void>
      /** Registra un gasto equitativo por API, pagado por `payer`, entre `participantIds`. */
      addExpenseByApi(
        payer: TestUser,
        groupId: string,
        description: string,
        amount: number,
        participantIds: string[],
      ): Chainable<{ id: string }>
    }
  }
}

const api = () => Cypress.expose("apiUrl") as string

Cypress.Commands.add("registerByApi", (label: string) => {
  const unique = `${Date.now().toString(36)}${Cypress._.random(1000, 9999)}`
  const user = {
    name: `E2E ${label}`,
    email: `e2e.${label.toLowerCase()}.${unique}@evenly.test`,
    password: "Prueba2026!",
  }
  return cy.request("POST", `${api()}/auth/register`, user).then((res) => ({
    ...user,
    id: res.body.user.id as string,
    token: res.body.token as string,
  }))
})

Cypress.Commands.add("loginAs", (user: TestUser) => {
  window.localStorage.setItem(
    "evenly-auth",
    JSON.stringify({
      state: { user: { id: user.id, name: user.name, email: user.email, avatarColor: "sky" }, token: user.token },
      version: 1,
    }),
  )
})

Cypress.Commands.add("createGroupByApi", (owner: TestUser, name: string, memberIds: string[]) => {
  return cy
    .request({
      method: "POST",
      url: `${api()}/groups`,
      headers: { Authorization: `Bearer ${owner.token}` },
      body: { name, category: "comida", memberIds },
    })
    .then((res) => ({ id: res.body.group.id as string }))
})

Cypress.Commands.add(
  "addExpenseByApi",
  (payer: TestUser, groupId: string, description: string, amount: number, participantIds: string[]) => {
    return cy
      .request({
        method: "POST",
        url: `${api()}/groups/${groupId}/expenses`,
        headers: { Authorization: `Bearer ${payer.token}` },
        body: {
          description,
          amount,
          paidById: payer.id,
          splitType: "equal",
          category: "comida",
          participants: participantIds.map((userId) => ({ userId })),
        },
      })
      .then((res) => ({ id: res.body.expense.id as string }))
  },
)

Cypress.Commands.add("befriendByApi", (a: TestUser, b: TestUser) => {
  cy.request({
    method: "POST",
    url: `${api()}/friends/requests`,
    headers: { Authorization: `Bearer ${a.token}` },
    body: { userId: b.id },
  })
  cy.request({
    method: "POST",
    url: `${api()}/friends/requests`,
    headers: { Authorization: `Bearer ${b.token}` },
    body: { userId: a.id },
  })
})
