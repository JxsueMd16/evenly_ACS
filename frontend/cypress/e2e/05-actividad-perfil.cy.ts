import type { TestUser } from "../support/commands"

describe("Actividad y perfil", () => {
  let owner: TestUser
  let friend: TestUser

  beforeEach(() => {
    cy.registerByApi("activo").then((u) => (owner = u))
    cy.registerByApi("companero").then((u) => (friend = u))
  })

  it("E2E-17 la actividad muestra los gastos de mis grupos con quién pagó", () => {
    cy.createGroupByApi(owner, "Actividad E2E", [friend.id]).then((group) => {
      cy.addExpenseByApi(owner, group.id, "Gasolina", 45, [owner.id, friend.id])
      cy.addExpenseByApi(friend, group.id, "Peajes", 12.5, [owner.id, friend.id])

      cy.loginAs(owner)
      cy.visit("/activity")
      cy.contains("a", "Peajes").should("contain.text", `${friend.name} pagó`).and("contain.text", "Actividad E2E")
      cy.contains("a", "Gasolina").should("contain.text", "Tú pagaste")
    })
  })

  it("E2E-18 el perfil solo muestra en el historial los gastos que pagué y el balance total", () => {
    cy.createGroupByApi(owner, "Perfil E2E", [friend.id]).then((group) => {
      cy.addExpenseByApi(owner, group.id, "Súper", 80, [owner.id, friend.id])
      cy.addExpenseByApi(friend, group.id, "Cine", 20, [owner.id, friend.id])

      cy.loginAs(owner)
      cy.visit("/profile")
      cy.contains("Cuentas que pagaste").should("be.visible")
      cy.contains("Súper").should("be.visible")
      cy.contains("Cine").should("not.exist")
      // Pagó 80 y le tocan 40 + 10: le deben 30.
      cy.contains("Te deben").should("contain.text", "30.00")
    })
  })
})
