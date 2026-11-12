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

      // UX-03: el caso común es escribir el monto y guardar.
      cy.get("#bill-total").should("be.focused").type("90")
      cy.get('[data-testid="bill-total"]').should("contain.text", "90.00")
      cy.get('[data-testid="bill-who"]').should("contain.text", "Pagaste tú").and("contain.text", "partes iguales entre 2")
      cy.get("#bill-name").type("Pizza")
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
      cy.contains("button", "Detallar por ítems").click()
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
      cy.get("#bill-total").type("abc12.345'; DROP TABLE--").should("have.value", "12.34")
      cy.contains("button", "Detallar por ítems").click()
      cy.get('[aria-label="Precio ítem 1"]').type("12.345'; DROP TABLE--").should("have.value", "12.34")
    })
  })
})

describe("Montos exactos y propina (UX-04, UX-05)", () => {
  let owner: TestUser
  let friend: TestUser

  beforeEach(() => {
    cy.registerByApi("exactos").then((u) => (owner = u))
    cy.registerByApi("propina").then((u) => (friend = u))
  })

  it("E2E-30 montos exactos: no deja guardar si no cuadra y guarda cuando cuadra", () => {
    cy.createGroupByApi(owner, "Exactos E2E", [friend.id]).then((group) => {
      cy.intercept("POST", "**/expenses").as("create")
      cy.loginAs(owner)
      cy.visit(`/groups/${group.id}/add-expense`)

      cy.get("#bill-total").type("100")
      cy.contains("button", "Montos exactos").click()
      cy.get(`[aria-label="Monto de ${owner.name}"]`).type("70")
      cy.get('[data-testid="manual-status"]').should("contain.text", "Faltan").and("contain.text", "30.00")
      cy.contains("button", "Guardar cuenta").click()
      cy.get('[role="alert"]').should("contain.text", "Faltan 30.00")
      cy.get("@create.all").should("have.length", 0)

      cy.get(`[aria-label="Monto de ${friend.name}"]`).type("30")
      cy.get('[data-testid="manual-status"]').should("contain.text", "Cuadra")
      cy.contains("button", "Guardar cuenta").click()
      cy.wait("@create").its("response.statusCode").should("eq", 201)
      cy.get('[data-testid="my-situation"]').should("contain.text", "te debe").and("contain.text", "30.00")
    })
  })

  it("E2E-31 propina del 10 % repartida y visible en el detalle", () => {
    cy.createGroupByApi(owner, "Propina E2E", [friend.id]).then((group) => {
      cy.loginAs(owner)
      cy.visit(`/groups/${group.id}/add-expense`)

      cy.get("#bill-total").type("120")
      cy.contains("button", "Agregar propina").click()
      cy.get('[data-testid="bill-subtotal"]').should("contain.text", "120.00")
      cy.get('[data-testid="bill-tip"]').should("contain.text", "12.00")
      cy.get('[data-testid="bill-total"]').should("contain.text", "132.00")
      cy.get(`[data-testid="share-${friend.id}"]`).should("contain.text", "66.00")
      cy.get("#bill-name").type("Almuerzo con propina")
      cy.contains("button", "Guardar cuenta").click()

      cy.get('[data-testid="bill-Almuerzo con propina"]').click()
      cy.get('[data-testid="detail-tip"]').should("contain.text", "120.00").and("contain.text", "12.00")
    })
  })
})
