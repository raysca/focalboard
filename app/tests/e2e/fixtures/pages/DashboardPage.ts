import { Locator } from '@playwright/test'
import { BasePage } from './BasePage'

export class DashboardPage extends BasePage {
    async goto() {
        await this.page.goto('/dashboard')
        await this.page.waitForSelector('[data-testid="board-list-controls"], [data-testid="empty-state"]')
    }

    async createBoard(title: string) {
        // Switch to 'My Boards' filter to ensure create button is always visible
        const filterSelect = this.page.getByTestId('board-filter-select')
        if (await filterSelect.isVisible()) {
            await filterSelect.selectOption('mine')
        }

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
        // Find board cards in main content area using the new board-card testid
        return this.page.locator('[data-testid="board-card"]').filter({ hasText: title })
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
