import type { TestUser } from "../support/commands"

const api = () => Cypress.expose("apiUrl") as string

describe("Notificaciones en tiempo real (SSE)", () => {
  let yo: TestUser
  let otro: TestUser

  beforeEach(() => {
    cy.registerByApi("receptor").then((u) => (yo = u))
    cy.registerByApi("emisor").then((u) => (otro = u))
  })

  it("E2E-24 una solicitud de amistad aparece al instante en la barra, sin recargar", () => {
    cy.loginAs(yo)
    cy.visit("/groups")
    // Espera a que la conexión en tiempo real esté abierta antes de provocar el evento.
    cy.get('nav[data-realtime="true"]').should("exist")
    cy.get('[data-testid="badge-friends"]').should("not.exist")

    // Otro usuario envía la solicitud mientras la app ya está abierta.
    cy.request({
      method: "POST",
      url: `${api()}/friends/requests`,
      headers: { Authorization: `Bearer ${otro.token}` },
      body: { userId: yo.id },
    })

    cy.contains(`${otro.name} te envió una solicitud de amistad`).should("be.visible")
    cy.get('[data-testid="badge-friends"]').should("have.text", "1")
    cy.get('a[aria-label="Amigos: 1 solicitud de amistad"]').should("exist")
    cy.location("pathname").should("eq", "/groups")
  })

  it("E2E-25 un gasto nuevo en mi grupo marca el pago pendiente al instante", () => {
    cy.createGroupByApi(otro, "Tiempo real E2E", [yo.id]).then((group) => {
      cy.loginAs(yo)
      cy.visit("/")
      cy.contains("Tiempo real E2E").should("be.visible")
      cy.get('nav[data-realtime="true"]').should("exist")
      cy.get('[data-testid="badge-groups"]').should("not.exist")

      cy.addExpenseByApi(otro, group.id, "Pizza", 40, [otro.id, yo.id])

      cy.contains(`registró "Pizza" en Tiempo real E2E`).should("be.visible")
      cy.get('[data-testid="badge-groups"]').should("have.text", "1")
      // UX-06: en Inicio aparece a quién le debes y cuánto, con el botón Pagar.
      cy.get('[data-testid="home-owe"]').should("contain.text", otro.name.split(" ")[0]).and("contain.text", "20.00")
      cy.location("pathname").should("eq", "/")
    })
  })

  it("E2E-32 recordatorio de cobro: llega al deudor y no se puede repetir en 24 h", () => {
    cy.createGroupByApi(otro, "Recordatorio E2E", [yo.id]).then((group) => {
      cy.addExpenseByApi(otro, group.id, "Almuerzo", 60, [otro.id, yo.id])
      cy.loginAs(yo)
      cy.visit("/")
      cy.get('nav[data-realtime="true"]').should("exist")

      // El acreedor (otro) envía el recordatorio por API; al deudor (yo) le llega en vivo.
      cy.request({
        method: "POST",
        url: `${Cypress.expose("apiUrl")}/debts/remind`,
        headers: { Authorization: `Bearer ${otro.token}` },
        body: { groupId: group.id, userId: yo.id },
      })
        .its("status")
        .should("eq", 201)
      cy.contains("te recuerda que le debes Q 30.00").should("be.visible")

      cy.request({
        method: "POST",
        url: `${Cypress.expose("apiUrl")}/debts/remind`,
        headers: { Authorization: `Bearer ${otro.token}` },
        body: { groupId: group.id, userId: yo.id },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(429)
        expect(res.body.error.code).to.eq("REMINDER_TOO_SOON")
      })
    })
  })

  it("E2E-33 el acreedor recuerda desde Inicio y el botón queda como 'Recordado'", () => {
    cy.createGroupByApi(yo, "Cobro E2E", [otro.id]).then((group) => {
      cy.addExpenseByApi(yo, group.id, "Taxi", 40, [yo.id, otro.id])
      cy.loginAs(yo)
      cy.visit("/")
      cy.get('[data-testid="home-owed"]').should("contain.text", "20.00")
      cy.get(`[aria-label="Recordar a ${otro.name}"]`).click()
      cy.contains(`Le recordamos a ${otro.name.split(" ")[0]}`).should("be.visible")
      cy.get(`[data-testid="reminded-${otro.id}"]`).should("contain.text", "Recordado")
      cy.reload()
      cy.get(`[data-testid="reminded-${otro.id}"]`).should("exist")
    })
  })
})
