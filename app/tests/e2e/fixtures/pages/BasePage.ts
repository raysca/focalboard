import { Page } from '@playwright/test'

export class BasePage {
    constructor(protected page: Page) {}

    async waitForNavigation(url: string) {
        await this.page.waitForURL(url)
    }

    async goto(url: string) {
        await this.page.goto(url)
    }
}
