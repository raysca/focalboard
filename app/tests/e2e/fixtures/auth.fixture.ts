import { test as base, Page } from '@playwright/test'
import { LoginPage } from './pages/LoginPage'

type AuthFixtures = {
    authenticatedPage: Page
    adminPage: Page
}

export const test = base.extend<AuthFixtures>({
    authenticatedPage: async ({ browser }, use) => {
        const context = await browser.newContext()
        const page = await context.newPage()

        // Login as regular user (Bob) - using email
        const loginPage = new LoginPage(page)
        await loginPage.goto()
        await loginPage.login('bob@focalboard.dev', 'demo1234')

        await use(page)
        await context.close()
    },

    adminPage: async ({ browser }, use) => {
        const context = await browser.newContext()
        const page = await context.newPage()

        // Login as admin user (Alice) - using email
        const loginPage = new LoginPage(page)
        await loginPage.goto()
        await loginPage.login('alice@focalboard.dev', 'demo1234')

        await use(page)
        await context.close()
    },
})

export { expect } from '@playwright/test'
