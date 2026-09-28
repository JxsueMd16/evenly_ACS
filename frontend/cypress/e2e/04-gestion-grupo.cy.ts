import type { TestUser } from "../support/commands"

describe("Gestión del grupo", () => {
  let owner: TestUser
  let friend: TestUser
  let other: TestUser

  beforeEach(() => {
    cy.registerByApi("admin").then((u) => (owner = u))
    cy.registerByApi("amigo").then((u) => (friend = u))
    cy.registerByApi("otro").then((u) => (other = u))
  })

  it("E2E-11 el admin renombra el grupo y cambia la categoría", () => {
    cy.createGroupByApi(owner, "Nombre viejo", [friend.id]).then((group) => {
      cy.loginAs(owner)
      cy.visit(`/groups/${group.id}`)
      cy.get('[aria-label="Ajustes del grupo"]').click()

      cy.contains("button", "Guardar cambios").should("be.disabled")
      cy.get("#settings-group-name").clear().type("Nombre nuevo")
      cy.contains("button", "Transporte").click()
      cy.contains("button", "Guardar cambios").click()

      cy.contains("Grupo actualizado").should("be.visible")
      cy.get("body").type("{esc}")
      cy.contains("h1", "Nombre nuevo").should("be.visible")
    })
  })

  it("E2E-12 el admin agrega a un integrante buscándolo y luego lo quita", () => {
    cy.createGroupByApi(owner, "Integrantes E2E", [friend.id]).then((group) => {
      cy.loginAs(owner)
      cy.visit(`/groups/${group.id}`)
      cy.contains("2 integrantes").should("be.visible")
      cy.get('[aria-label="Ajustes del grupo"]').click()

      cy.get("#add-member-search").type(other.email)
      cy.get(`[aria-label="Agregar a ${other.name}"]`).click()
      cy.contains(`${other.name} se unió al grupo`).should("be.visible")
      cy.contains("Integrantes (3)").should("be.visible")

      cy.get(`[aria-label="Quitar a ${other.name}"]`).click()
      cy.contains("button", /^Quitar$/).click()
      cy.contains(`${other.name} ya no es parte del grupo`).should("be.visible")
      cy.contains("Integrantes (2)").should("be.visible")
    })
  })

  it("E2E-13 no permite quitar a un integrante que participa en gastos y explica por qué", () => {
    cy.createGroupByApi(owner, "Con gastos E2E", [friend.id]).then((group) => {
      cy.addExpenseByApi(owner, group.id, "Cena", 40, [owner.id, friend.id])
      cy.loginAs(owner)
      cy.visit(`/groups/${group.id}`)
      cy.get('[aria-label="Ajustes del grupo"]').click()

      cy.get(`[aria-label="Quitar a ${friend.name}"]`).click()
      cy.contains("button", /^Quitar$/).click()
      cy.get('[role="alert"]').should("contain.text", "participa en gastos del grupo")
      // El diálogo sigue abierto y el integrante sigue en la lista.
      cy.contains("button", "Cancelar").click()
      cy.contains("Integrantes (2)").should("be.visible")
    })
  })

  it("E2E-14 elimina una cuenta desde su detalle y los balances se recalculan; otros integrantes no pueden", () => {
    cy.createGroupByApi(owner, "Borrar gasto E2E", [friend.id]).then((group) => {
      cy.addExpenseByApi(owner, group.id, "Hotel", 100, [owner.id, friend.id])

      // El amigo no creó ni pagó la cuenta y no es admin: ve el detalle pero no el botón de eliminar.
      cy.loginAs(friend)
      cy.visit(`/groups/${group.id}`)
      cy.get('[aria-label="Ver cuenta Hotel"]').click()
      cy.contains("Cuánto le toca a cada quien").should("be.visible")
      cy.contains("button", "Eliminar cuenta").should("not.exist")

      cy.loginAs(owner)
      cy.visit(`/groups/${group.id}`)
      cy.contains("p", /^Tú$/).parent().should("contain.text", "+").and("contain.text", "50.00")
      cy.get('[aria-label="Ver cuenta Hotel"]').click()
      cy.contains("button", "Eliminar cuenta").click()
      cy.contains("button", /^Eliminar$/).click()

      cy.contains("Cuenta eliminada").should("be.visible")
      cy.contains("Aún no hay cuentas en este grupo.").should("be.visible")
      cy.contains("p", /^Tú$/).parent().should("contain.text", "Al día")
    })
  })

  it("E2E-15 un integrante sin gastos sale del grupo", () => {
    cy.createGroupByApi(owner, "Salir E2E", [friend.id]).then((group) => {
      cy.loginAs(friend)
      cy.visit(`/groups/${group.id}`)
      cy.get('[aria-label="Ajustes del grupo"]').click()
      cy.contains("Solo el administrador puede editar el grupo.").should("be.visible")
      cy.get("#settings-group-name").should("not.exist")

      cy.contains("button", "Salir del grupo").click()
      cy.contains("button", /^Salir$/).click()

      cy.location("pathname").should("eq", "/groups")
      cy.contains("Saliste del grupo").should("be.visible")
      cy.contains("Salir E2E").should("not.exist")
    })
  })

  it("E2E-16 el admin elimina el grupo", () => {
    cy.createGroupByApi(owner, "Eliminar E2E", [friend.id]).then((group) => {
      cy.addExpenseByApi(owner, group.id, "Entradas", 30, [owner.id, friend.id])
      cy.loginAs(owner)
      cy.visit(`/groups/${group.id}`)
      cy.get('[aria-label="Ajustes del grupo"]').click()

      cy.contains("button", "Eliminar grupo").click()
      cy.contains("Esta acción no se puede deshacer.").should("be.visible")
      cy.get('[role="dialog"]').last().contains("button", "Eliminar grupo").click()

      cy.location("pathname").should("eq", "/groups")
      cy.contains("Grupo eliminado").should("be.visible")
      cy.contains("Eliminar E2E").should("not.exist")
    })
  })
})
