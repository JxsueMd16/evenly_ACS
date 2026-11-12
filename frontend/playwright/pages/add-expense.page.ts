import type { Locator, Page } from "@playwright/test"
import { BasePage } from "./base.page"

/** Pantalla "¿Con quién fue?" y formulario de la cuenta (UX-02, UX-03, UX-05). */
export class AddExpensePage extends BasePage {
  readonly heading: Locator
  readonly amountInput: Locator
  readonly nameInput: Locator
  readonly addTipButton: Locator
  readonly total: Locator
  readonly tip: Locator
  readonly saveButton: Locator

  constructor(page: Page) {
    super(page)
    this.heading = page.getByRole("heading", { name: "¿Con quién fue?" })
    this.amountInput = page.getByLabel("¿Cuánto fue?")
    this.nameInput = page.getByLabel("Nombre (opcional)")
    this.addTipButton = page.getByRole("button", { name: "Agregar propina" })
    this.total = page.getByTestId("bill-total")
    this.tip = page.getByTestId("bill-tip")
    this.saveButton = page.getByRole("button", { name: "Guardar cuenta" })
  }

  async goto(): Promise<void> {
    await this.navigate("/add-expense")
  }

  group(name: string): Locator {
    return this.page.getByRole("link", { name: `Agregar gasto en ${name}` })
  }

  share(userId: string): Locator {
    return this.page.getByTestId(`share-${userId}`)
  }
}
