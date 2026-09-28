import type { TestUser } from "../support/commands"

describe("Grupos y cuentas", () => {
  let owner: TestUser
  let friend: TestUser

  beforeEach(() => {
    cy.registerByApi("owner").then((u) => (owner = u))
    cy.registerByApi("friend").then((u) => (friend = u))
  })

  it("E2E-06 crea un grupo buscando a un integrante por correo y entra a él", () => {
    cy.loginAs(owner)
    cy.visit("/groups")
    cy.contains("button", "Nuevo").click()

    cy.get("#group-name").type("Viaje E2E")
    cy.get("#member-search").type(friend.email)
    cy.contains("button", friend.name).click()
    cy.contains("button", "Crear grupo").click()

    cy.contains("Grupo creado").should("be.visible")
    cy.location("pathname").should("match", /^\/groups\/[a-z0-9]+$/)
    cy.contains("h1", "Viaje E2E").should("be.visible")
    cy.contains("2 integrantes").should("be.visible")
  })

  it("E2E-07 registra una cuenta en partes iguales y actualiza el balance", () => {
    cy.createGroupByApi(owner, "Cena E2E", [friend.id]).then((group) => {
      cy.loginAs(owner)
      cy.visit(`/groups/${group.id}/add-expense`)

      cy.get("#bill-name").type("Pizza")
      cy.get('[aria-label="Descripción ítem 1"]').type("Pizza familiar")
      cy.get('[aria-label="Precio ítem 1"]').type("90")
      cy.get('[data-testid="bill-total"]').should("contain.text", "90.00")
      cy.contains("button", "Guardar cuenta").click()

      cy.contains("Cuenta guardada").should("be.visible")
      cy.location("pathname").should("eq", `/groups/${group.id}`)
      cy.contains("Pizza").should("be.visible")
      cy.contains("tu parte").should("contain.text", "45.00")
      // El dueño pagó 90 y le toca 45: le deben 45.
      cy.contains("p", /^Tú$/).parent().should("contain.text", "+").and("contain.text", "45.00")
      cy.contains("Para quedar a mano").should("be.visible")
    })
  })

  it("E2E-08 no permite guardar una división por ítems con unidades sin asignar", () => {
    cy.createGroupByApi(owner, "Descuadre E2E", [friend.id]).then((group) => {
      cy.intercept("POST", "**/expenses").as("create")
      cy.loginAs(owner)
      cy.visit(`/groups/${group.id}/add-expense`)

      cy.get("#bill-name").type("Súper")
      cy.get('[aria-label="Descripción ítem 1"]').type("Bebida")
      cy.get('[aria-label="Precio ítem 1"]').type("5")
      cy.get('[aria-label="Cantidad ítem 1: más"]').click().click().click()
      cy.contains("button", "Por ítems").click()
      cy.get(`[aria-label="Bebida: unidades de ${friend.name}: más"]`).click().click()
      cy.get('[data-testid="assign-line-1"]').should("contain.text", "Faltan 2")
      cy.contains("button", "Guardar cuenta").click()

      cy.get('[role="alert"]').should("contain.text", 'Faltan 2 de 4 de "Bebida" por asignar')
      cy.get("@create.all").should("have.length", 0)
      cy.location("pathname").should("eq", `/groups/${group.id}/add-expense`)
    })
  })

  it("E2E-09 limpia caracteres no numéricos del precio (entrada maliciosa)", () => {
    cy.createGroupByApi(owner, "Montos E2E", []).then((group) => {
      cy.loginAs(owner)
      cy.visit(`/groups/${group.id}/add-expense`)
      cy.get('[aria-label="Precio ítem 1"]').type("12.345'; DROP TABLE--").should("have.value", "12.34")
    })
  })
})
