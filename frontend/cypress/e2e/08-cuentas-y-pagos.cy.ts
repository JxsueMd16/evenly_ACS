import type { TestUser } from "../support/commands"

const api = () => Cypress.expose("apiUrl") as string

describe("Cuentas por ítems y cuenta rápida", () => {
  let josue: TestUser
  let alexis: TestUser
  let picon: TestUser

  beforeEach(() => {
    cy.registerByApi("josue").then((u) => (josue = u))
    cy.registerByApi("alexis").then((u) => (alexis = u))
    cy.registerByApi("picon").then((u) => (picon = u))
  })

  it("E2E-26 almuerzo del sábado dividido por ítems: 30 / 35 / 20", () => {
    cy.createGroupByApi(josue, "Universidad", [alexis.id, picon.id]).then((group) => {
      cy.loginAs(josue)
      cy.visit(`/groups/${group.id}`)
      cy.contains("a", "Nueva cuenta").click()

      cy.contains("button", "Comida").click()
      cy.get("#bill-name").type("Almuerzo sábado")
      // 2 × Churrasco 25, 1 × Churrasco 15, 4 × Bebida 5
      cy.get('[aria-label="Descripción ítem 1"]').type("Churrasco 25")
      cy.get('[aria-label="Precio ítem 1"]').type("25")
      cy.get('[aria-label="Cantidad ítem 1: más"]').click()
      cy.contains("button", "Agregar ítem").click()
      cy.get('[aria-label="Descripción ítem 2"]').type("Churrasco 15")
      cy.get('[aria-label="Precio ítem 2"]').type("15")
      cy.contains("button", "Agregar ítem").click()
      cy.get('[aria-label="Descripción ítem 3"]').type("Bebida")
      cy.get('[aria-label="Precio ítem 3"]').type("5")
      cy.get('[aria-label="Cantidad ítem 3: más"]').click().click().click()
      cy.get('[data-testid="bill-total"]').should("contain.text", "85.00")

      cy.contains("button", "Por ítems").click()
      cy.get(`[aria-label="Churrasco 25: unidades de ${josue.name}: más"]`).click()
      cy.get(`[aria-label="Churrasco 25: unidades de ${alexis.name}: más"]`).click()
      cy.get(`[aria-label="Churrasco 15: unidades de ${picon.name}: más"]`).click()
      cy.get(`[aria-label="Bebida: unidades de ${josue.name}: más"]`).click()
      cy.get(`[aria-label="Bebida: unidades de ${alexis.name}: más"]`).click().click()
      cy.get(`[aria-label="Bebida: unidades de ${picon.name}: más"]`).click()

      cy.get(`[data-testid="share-${josue.id}"]`).should("contain.text", "30.00")
      cy.get(`[data-testid="share-${alexis.id}"]`).should("contain.text", "35.00")
      cy.get(`[data-testid="share-${picon.id}"]`).should("contain.text", "20.00")
      cy.contains("button", "Guardar cuenta").click()

      cy.contains("Cuenta guardada").should("be.visible")
      cy.get('[aria-label="Ver cuenta Almuerzo sábado"]').click()
      cy.get(`[data-testid="detail-share-${alexis.id}"]`)
        .should("contain.text", "1 × Churrasco 25, 2 × Bebida")
        .and("contain.text", "35.00")
    })
  })

  it("E2E-27 cuenta rápida sin grupo con un ítem compartido", () => {
    cy.loginAs(josue)
    cy.visit("/add-expense")
    cy.contains("Cuenta rápida").click()

    cy.get("#quick-search").type(alexis.email)
    cy.contains("button", alexis.name).click()
    cy.contains("button", "Continuar con 1 persona").click()

    cy.get("#bill-name").type("Pizza viernes")
    cy.get('[aria-label="Descripción ítem 1"]').type("Pizza grande")
    cy.get('[aria-label="Precio ítem 1"]').type("99.99")
    cy.contains("button", "Por ítems").click()
    cy.get('[data-testid="assign-line-1"]').contains("label", "Compartido").click()
    cy.get(`[aria-label="Pizza grande: compartido con ${josue.name}"]`).click()
    cy.get(`[aria-label="Pizza grande: compartido con ${alexis.name}"]`).click()
    cy.get(`[data-testid="share-${josue.id}"]`).should("contain.text", "50.00")
    cy.get(`[data-testid="share-${alexis.id}"]`).should("contain.text", "49.99")
    cy.contains("button", "Guardar cuenta").click()

    cy.contains("Cuenta rápida guardada").should("be.visible")
    cy.contains("Cuenta rápida ·").should("be.visible")
    cy.visit("/groups")
    cy.contains("Cuentas rápidas").parent().should("contain.text", "Pizza viernes")
  })
})

describe("Datos de pago y pagos en dos pasos", () => {
  let acreedor: TestUser
  let deudor: TestUser

  beforeEach(() => {
    cy.registerByApi("acreedor").then((u) => (acreedor = u))
    cy.registerByApi("deudor").then((u) => (deudor = u))
  })

  it("E2E-28 el usuario registra su cuenta bancaria y su preferencia en el perfil", () => {
    cy.loginAs(acreedor)
    cy.visit("/profile")
    cy.get('[aria-label="Preferencia de pago"]').contains("button", "Transferencia").click()
    cy.contains("Preferencia de pago guardada").should("be.visible")

    cy.contains("button", "Agregar cuenta bancaria").click()
    cy.get("#bank-name").select("Banco Industrial")
    cy.contains("button", "Ahorro").click()
    cy.get("#bank-number").type("123-456789-0")
    cy.contains("button", "Guardar cuenta").click()

    cy.contains("Cuenta agregada").should("be.visible")
    cy.get('[data-testid="bank-account"]').should("contain.text", "Banco Industrial · Ahorro").and("contain.text", "123-456789-0")
    cy.get('[aria-label="Hacer privada la cuenta 123-456789-0"]').click()
    cy.get('[data-testid="bank-account"]').should("contain.text", "Solo tú")
  })

  it("E2E-29 quien debe registra el pago con comprobante y quien recibe lo confirma", () => {
    cy.request({
      method: "POST",
      url: `${api()}/me/bank-accounts`,
      headers: { Authorization: `Bearer ${acreedor.token}` },
      body: { bank: "Banrural", type: "MONETARIA", number: "3045-000111-2", holder: acreedor.name },
    })
    cy.createGroupByApi(acreedor, "Pagos E2E", [deudor.id]).then((group) => {
      cy.addExpenseByApi(acreedor, group.id, "Cena", 70, [acreedor.id, deudor.id])

      // Paso 1: quien debe registra el pago.
      cy.loginAs(deudor)
      cy.visit(`/groups/${group.id}`)
      cy.get(`[aria-label="Pagar a ${acreedor.name.split(" ")[0]}"]`).click()
      cy.get('[data-testid="receiver-account"]').should("contain.text", "Banrural").and("contain.text", "3045-000111-2")
      cy.get("#pay-amount").should("have.value", "35.00")
      cy.get('[data-testid="evidence-input"]').selectFile("cypress/fixtures/comprobante.png", { force: true })
      cy.get('img[alt="Comprobante"]').should("be.visible")
      cy.contains("button", "Registrar pago").click()
      cy.contains("debe confirmar que lo recibió").should("be.visible")
      cy.contains("Por confirmar").should("be.visible")

      // Paso 2: quien recibe confirma el monto completo.
      cy.loginAs(acreedor)
      cy.visit(`/groups/${group.id}`)
      cy.get('[data-testid="payment-to-confirm"]').should("contain.text", "35.00").within(() => {
        cy.contains("button", "Ver comprobante").click()
      })
      cy.get('img[alt="Comprobante de pago"]').should("be.visible")
      cy.get("body").type("{esc}")
      cy.contains("button", "Recibido completo").click()
      cy.contains("Pago confirmado").should("be.visible")
      cy.get('[data-testid="payment-row"]').should("contain.text", "Confirmado")
      cy.contains("p", /^Tú$/).parent().should("contain.text", "Al día")
    })
  })
})
