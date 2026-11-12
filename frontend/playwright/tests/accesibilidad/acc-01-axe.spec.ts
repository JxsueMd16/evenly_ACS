import AxeBuilder from "@axe-core/playwright"
import type { Page, TestInfo } from "@playwright/test"
import { expect, signIn, test } from "../../fixtures/evenly.fixture"

/**
 * ACC-01 (RNF-08, UX-NF-02): auditoría automática de accesibilidad con axe-core
 * (reglas WCAG 2.1 A y AA) en las pantallas principales, en viewport móvil.
 * Criterio: 0 violaciones de impacto "serious" o "critical". Todas las
 * violaciones (de cualquier impacto) se adjuntan al reporte como evidencia.
 */
test.use({ viewport: { width: 390, height: 844 } })

async function audit(page: Page, testInfo: TestInfo, screen: string) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()
  const summary = results.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length }))
  await testInfo.attach(`axe-${screen}.json`, { body: JSON.stringify(summary, null, 2), contentType: "application/json" })
  console.log(`[ACC-01] ${screen}: ${results.passes.length} reglas OK, ${results.violations.length} violaciones`, JSON.stringify(summary))
  const blocking = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical")
  expect(blocking, `violaciones graves en ${screen}: ${JSON.stringify(summary)}`).toEqual([])
}

test.describe("ACC-01 accesibilidad (axe-core, WCAG 2.1 AA)", () => {
  test("ACC-01a inicio de sesión", async ({ page, loginPage }, testInfo) => {
    await loginPage.goto()
    await expect(loginPage.submitButton).toBeVisible()
    await audit(page, testInfo, "login")
  })

  test("ACC-01b Inicio con deudas, detalle de grupo y formulario de gasto", async ({ page, data, homePage, groupPage, addExpensePage }, testInfo) => {
    const me = await data.user("a11y")
    const friend = await data.user("a11yamigo")
    const groupId = await data.group(friend, "Accesible", [me])
    await data.equalExpense(friend, groupId, "Almuerzo", 60, [friend, me])
    await signIn(page, me)

    await homePage.goto()
    await expect(homePage.oweList).toBeVisible()
    await audit(page, testInfo, "inicio")

    await groupPage.goto(groupId)
    await expect(groupPage.mySituation).toBeVisible()
    await audit(page, testInfo, "grupo")

    await page.goto(`/groups/${groupId}/add-expense`)
    await expect(addExpensePage.amountInput).toBeVisible()
    await audit(page, testInfo, "formulario-gasto")
  })
})
