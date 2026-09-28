import type { TestUser } from "../support/commands"

describe("Seguridad en la interfaz", () => {
  it("E2E-10 un usuario no puede abrir el grupo de otro cambiando la URL", () => {
    let outsider: TestUser
    cy.registerByApi("outsider").then((u) => (outsider = u))
    cy.registerByApi("dueno").then((owner) => {
      cy.createGroupByApi(owner, "Grupo privado E2E", []).then((group) => {
        cy.loginAs(outsider)
        cy.visit(`/groups/${group.id}`)

        cy.location("pathname").should("eq", "/groups")
        cy.contains("Ese grupo no existe o no perteneces a él.").should("be.visible")
        cy.contains("Grupo privado E2E").should("not.exist")
      })
    })
  })
})
