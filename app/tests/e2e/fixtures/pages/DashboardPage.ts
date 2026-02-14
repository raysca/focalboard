import { Locator } from '@playwright/test'
import { BasePage } from './BasePage'

export class DashboardPage extends BasePage {
    async goto() {
        await this.page.goto('/dashboard')
    }

    async createBoard(title: string) {
        // Click "Create New Board" button or "Create Board" button
        await this.page.getByRole('button', { name: /create.*board/i }).first().click()

        // Fill in the board title - actual placeholder is "e.g., Q1 Roadmap"
        await this.page.getByPlaceholder('e.g., Q1 Roadmap').fill(title)

        // Click the Create Board submit button
        await this.page.getByRole('button', { name: /^create board$/i }).click()

        // Wait for navigation to the board page
        await this.page.waitForURL(/\/board\/.+/)
    }

    async getBoardByTitle(title: string): Promise<Locator> {
        // Find board cards in the main content area only (not sidebar)
        // Use data-testid to specifically target board items in dashboard grid
        return this.page.locator('[data-testid="board-item"]').filter({ hasText: title })
    }

    async openUserMenu() {
        // Click on the user menu button (look for button with user display name)
        await this.page.getByRole('button', { name: /bob|alice|User/i }).first().click()
    }

    async logout() {
        await this.openUserMenu()
        await this.page.getByRole('button', { name: /log out/i }).click()
        await this.waitForNavigation('/login')
    }
}
