import type { TestUser } from "../support/commands"

describe("Contraseña visible y requisitos", () => {
  it("E2E-19 muestra u oculta la contraseña y marca los requisitos mientras se escribe", () => {
    cy.visit("/register")
    cy.get("#password").should("have.attr", "type", "password").type("abc")
    cy.get('[aria-label="Requisitos de la contraseña"] li[data-ok="true"]').should("have.length", 1)

    cy.get('[aria-label="Mostrar contraseña"]').first().click()
    cy.get("#password").should("have.attr", "type", "text").and("have.value", "abc")

    cy.get("#password").type("DEF12!")
    cy.get('[aria-label="Requisitos de la contraseña"] li[data-ok="false"]').should("have.length", 0)

    cy.get('[aria-label="Ocultar contraseña"]').first().click()
    cy.get("#password").should("have.attr", "type", "password")
  })
})

describe("Amigos", () => {
  let ana: TestUser
  let beto: TestUser

  beforeEach(() => {
    cy.registerByApi("ana").then((u) => (ana = u))
    cy.registerByApi("beto").then((u) => (beto = u))
  })

  it("E2E-20 envía una solicitud de amistad y el otro la acepta", () => {
    cy.loginAs(ana)
    cy.visit("/friends")
    cy.get("#friend-search").type(beto.email)
    cy.get(`[aria-label="Agregar amigo ${beto.name}"]`).click()
    cy.contains(`Solicitud enviada a ${beto.name}`).should("be.visible")
    cy.contains("Solicitudes enviadas").parent().should("contain.text", beto.name)

    cy.loginAs(beto)
    cy.visit("/")
    cy.contains("Tienes 1 solicitud de amistad").click()
    cy.location("pathname").should("eq", "/friends")
    cy.get(`[aria-label="Aceptar a ${ana.name}"]`).click()
    cy.contains(`Ahora eres amigo de ${ana.name}`).should("be.visible")
    cy.contains("Tus amigos (1)").parent().should("contain.text", ana.name)
  })

  it("E2E-21 crea un grupo eligiendo a un amigo sin buscarlo", () => {
    cy.befriendByApi(ana, beto)
    cy.loginAs(ana)
    cy.visit("/groups")
    cy.contains("button", "Nuevo").click()
    cy.get("#group-name").type("Con amigos E2E")
    cy.contains("Elige entre tus amigos").should("be.visible")
    cy.get('[role="dialog"]').contains("button", beto.name).click()
    cy.contains("button", "Crear grupo").click()

    cy.contains("Grupo creado").should("be.visible")
    cy.contains("h1", "Con amigos E2E").should("be.visible")
    cy.contains("2 integrantes").should("be.visible")
  })
})

describe("Invitación por enlace", () => {
  it("E2E-22 quien abre el enlace sin sesión inicia sesión y se une al grupo", () => {
    cy.registerByApi("anfitrion").then((host) => {
      cy.registerByApi("invitado").then((guest) => {
        cy.createGroupByApi(host, "Viaje por enlace", []).then((group) => {
          cy.loginAs(host)
          cy.visit(`/groups/${group.id}`)
          cy.get('[aria-label="Invitar al grupo"]').click()
          cy.get('[aria-label="Enlace de invitación"]')
            .invoke("val")
            .then((link) => {
              const path = new URL(String(link)).pathname
              expect(path).to.match(/^\/join\/[A-Za-z0-9_-]{12}$/)

              // El invitado abre el enlace sin sesión: pasa por el login y vuelve a la invitación.
              cy.clearLocalStorage()
              cy.visit(path)
              cy.location("pathname").should("eq", "/login")
              cy.get("#email").type(guest.email)
              cy.get("#password").type(guest.password)
              cy.contains("button", "Iniciar sesión").click()

              cy.location("pathname").should("eq", path)
              cy.contains("Te invitaron a unirte a").should("be.visible")
              cy.contains("h1", "Viaje por enlace").should("be.visible")
              cy.contains("button", "Unirme al grupo").click()

              cy.location("pathname").should("eq", `/groups/${group.id}`)
              cy.contains("2 integrantes").should("be.visible")
            })
        })
      })
    })
  })

  it("E2E-23 un enlace inválido muestra un mensaje claro", () => {
    cy.registerByApi("perdido").then((user) => {
      cy.loginAs(user)
      cy.visit("/join/codigoInexistente")
      cy.contains("No pudimos abrir la invitación").should("be.visible")
      cy.contains("no es válido o ya fue reemplazado").should("be.visible")
    })
  })
})
