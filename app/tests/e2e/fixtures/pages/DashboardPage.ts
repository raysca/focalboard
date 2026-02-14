import { Locator } from '@playwright/test'
import { BasePage } from './BasePage'

export class DashboardPage extends BasePage {
    async goto() {
        await this.page.goto('/dashboard')
    }

    async createBoard(title: string) {
        // Click "Create New Board" button or "Create Board" button
        await this.page.getByRole('button', { name: /create.*board/i }).first().click()

        // Fill in the board title
        await this.page.getByPlaceholder(/board name|roadmap/i).fill(title)

        // Click the Create Board submit button
        await this.page.getByRole('button', { name: /^create board$/i }).click()

        // Wait for navigation to the board page
        await this.page.waitForURL(/\/board\/.+/)
    }

    async getBoardByTitle(title: string): Promise<Locator> {
        // Find board by its title text
        return this.page.getByRole('link').filter({ hasText: title })
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
