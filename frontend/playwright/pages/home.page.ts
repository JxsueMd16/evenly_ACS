import type { Locator, Page } from "@playwright/test"
import { BasePage } from "./base.page"

export class HomePage extends BasePage {
  readonly balanceCard: Locator
  readonly oweList: Locator
  readonly owedList: Locator
  readonly addButton: Locator

  constructor(page: Page) {
    super(page)
    this.balanceCard = page.getByText("Balance total")
    this.oweList = page.getByTestId("home-owe")
    this.owedList = page.getByTestId("home-owed")
    this.addButton = page.getByRole("link", { name: "Agregar" })
  }

  async goto(): Promise<void> {
    await this.navigate("/")
  }

  payButton(name: string): Locator {
    return this.page.getByRole("link", { name: new RegExp(`^Pagar a ${name}`) })
  }
}
