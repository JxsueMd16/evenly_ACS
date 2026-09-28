describe("Autenticación", () => {
  it("E2E-01 registra una cuenta nueva y entra al inicio", () => {
    const email = `e2e.registro.${Date.now()}@evenly.test`
    cy.visit("/register")
    cy.get("#name").type("Laura Pruebas")
    cy.get("#email").type(email)
    cy.get("#password").type("Prueba2026!")
    cy.get("#confirm").type("Prueba2026!")
    cy.contains("button", "Crear cuenta").click()

    cy.location("pathname").should("eq", "/")
    cy.contains("h1", "Laura").should("be.visible")
    cy.contains("Balance total").should("be.visible")
  })

  it("E2E-02 valida la política de contraseña antes de llamar a la API", () => {
    cy.intercept("POST", "**/auth/register").as("register")
    cy.visit("/register")
    cy.get("#name").type("Laura Pruebas")
    cy.get("#email").type("laura@evenly.test")
    cy.get("#password").type("corta")
    cy.get("#confirm").type("corta")
    cy.contains("button", "Crear cuenta").click()

    cy.contains("La contraseña no cumple todos los requisitos.").should("be.visible")
    cy.get('[aria-label="Requisitos de la contraseña"] li[data-ok="false"]').should("have.length.at.least", 3)
    cy.location("pathname").should("eq", "/register")
    cy.get("@register.all").should("have.length", 0)
  })

  it("E2E-03 muestra un error claro con credenciales incorrectas y no inicia sesión", () => {
    cy.visit("/login")
    cy.get("#email").type("paul@evenly.app")
    cy.get("#password").type("Incorrecta99")
    cy.contains("button", "Iniciar sesión").click()

    cy.contains("Correo o contraseña incorrectos.").should("be.visible")
    cy.location("pathname").should("eq", "/login")
    cy.window().then((win) => {
      const saved = JSON.parse(win.localStorage.getItem("evenly-auth") ?? "{}")
      expect(saved.state?.token ?? null).to.eq(null)
    })
  })

  it("E2E-04 redirige a /login al abrir una ruta protegida sin sesión", () => {
    cy.visit("/groups")
    cy.location("pathname").should("eq", "/login")
  })

  it("E2E-05 cierra la sesión si el token ya no es válido", () => {
    cy.registerByApi("tokenmalo").then((user) => {
      cy.loginAs({ ...user, token: `${user.token}x` })
      cy.visit("/groups")
      cy.location("pathname").should("eq", "/login")
    })
  })
})
