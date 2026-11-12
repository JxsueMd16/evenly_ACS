import type { Locator, Page } from "@playwright/test"
import { BasePage } from "./base.page"

export class GroupPage extends BasePage {
  readonly mySituation: Locator

  constructor(page: Page) {
    super(page)
    this.mySituation = page.getByTestId("my-situation")
  }

  async goto(groupId: string): Promise<void> {
    await this.navigate(`/groups/${groupId}`)
  }

  bill(description: string): Locator {
    return this.page.getByRole("button", { name: `Ver cuenta ${description}` })
  }
}
