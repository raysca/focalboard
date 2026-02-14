import { Locator } from '@playwright/test'
import { BasePage } from './BasePage'

export class BoardPage extends BasePage {
    async createCard() {
        // Click the "New" button to add a card
        await this.page.getByRole('button', { name: /^new$/i }).first().click()
        // Wait for the new card to appear
        await this.page.waitForTimeout(500)
    }

    async getCardByTitle(title: string): Promise<Locator> {
        // Find card by its title text (cards are clickable elements with titles)
        return this.page.locator('.rounded-\\[var\\(--radius-default\\)\\].p-3').filter({ hasText: title })
    }

    async openBoardMenu() {
        // Look for a menu button (3 dots, settings, etc.)
        await this.page.getByRole('button', { name: /menu|options|settings/i }).click()
    }

    async deleteBoard() {
        await this.openBoardMenu()
        await this.page.getByRole('button', { name: /delete.*board/i }).click()
        await this.page.getByRole('button', { name: /confirm/i }).click()
        await this.waitForNavigation('/dashboard')
    }
}
