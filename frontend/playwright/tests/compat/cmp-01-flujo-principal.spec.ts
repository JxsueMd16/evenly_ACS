import { expect, signIn, test, TEST_PASSWORD } from "../../fixtures/evenly.fixture"

/**
 * CMP-01 (RNF-07): el flujo principal funciona igual en Chromium, Firefox,
 * WebKit (Safari) y en dos teléfonos (Pixel 5 e iPhone 13). Cada proyecto de
 * playwright.config.ts corre estas mismas pruebas.
 */
test.describe("CMP-01 compatibilidad del flujo principal", () => {
  test("CMP-01a inicia sesión con la interfaz y llega a Inicio con montos en quetzales", async ({ page, data, loginPage, homePage }) => {
    const user = await data.user("login")
    await loginPage.goto()
    await loginPage.login(user.email, TEST_PASSWORD)

    await expect(page).toHaveURL("/")
    await expect(page.getByRole("heading", { level: 1, name: "PW" })).toBeVisible()
    await expect(homePage.balanceCard).toBeVisible()
    // Intl separa "Q" del número con un espacio duro (U+00A0): \s cubre ambos.
    await expect(page.getByText(/^Q\s0\.00$/)).toBeVisible()
  })

  test("CMP-01b registra un almuerzo con propina en 4 toques y ve su situación en el grupo", async ({ page, data, addExpensePage, groupPage }) => {
    const payer = await data.user("paga")
    const friend = await data.user("amigo")
    await data.group(payer, "Almuerzo PW", [friend])
    await signIn(page, payer)

    await addExpensePage.goto()
    await expect(addExpensePage.heading).toBeVisible()
    await addExpensePage.group("Almuerzo PW").click()

    await addExpensePage.amountInput.fill("120")
    await addExpensePage.addTipButton.click()
    await expect(addExpensePage.tip).toHaveText(/12\.00/)
    await expect(addExpensePage.total).toHaveText(/132\.00/)
    await expect(addExpensePage.share(friend.id)).toHaveText(/66\.00/)
    await addExpensePage.nameInput.fill("Almuerzo con propina")
    await addExpensePage.saveButton.click()

    await expect(page.getByText("Cuenta guardada")).toBeVisible()
    await expect(groupPage.mySituation).toContainText("te debe")
    await expect(groupPage.mySituation).toContainText("66.00")
    await expect(groupPage.bill("Almuerzo con propina")).toBeVisible()
  })

  test("CMP-01c quien debe ve la deuda en Inicio y 'Pagar' abre el pago directo", async ({ page, data, homePage }) => {
    const payer = await data.user("acreedor")
    const debtor = await data.user("deudor")
    const groupId = await data.group(payer, "Deuda PW", [debtor])
    await data.equalExpense(payer, groupId, "Pizza", 80, [payer, debtor])
    await signIn(page, debtor)

    await homePage.goto()
    await expect(homePage.oweList).toContainText("40.00")
    await homePage.payButton("PW").click()

    await expect(page).toHaveURL(new RegExp(`/groups/${groupId}$`))
    await expect(page.getByRole("dialog")).toContainText(`Pagar a ${payer.name}`)
  })
})
