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
      cy.contains("Tienes pagos pendientes: debes").should("contain.text", "20.00")
      cy.location("pathname").should("eq", "/")
    })
  })
})
