import type { Locator, Page } from "@playwright/test"
import { BasePage } from "./base.page"

export class LoginPage extends BasePage {
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator

  constructor(page: Page) {
    super(page)
    this.emailInput = page.getByLabel("Correo")
    this.passwordInput = page.getByLabel("Contraseña", { exact: true })
    this.submitButton = page.getByRole("button", { name: "Iniciar sesión" })
  }

  async goto(): Promise<void> {
    await this.navigate("/login")
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }
}
