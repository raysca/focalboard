import { test, expect } from '@playwright/test'
import { LoginPage } from './fixtures/pages/LoginPage'
import { RegisterPage } from './fixtures/pages/RegisterPage'
import { DashboardPage } from './fixtures/pages/DashboardPage'

test.describe('Authentication', () => {
    test('should register new user', async ({ page }) => {
        const registerPage = new RegisterPage(page)
        await registerPage.goto()

        // Generate unique email and username for test
        const timestamp = Date.now()
        const email = `testuser-${timestamp}@test.com`
        const username = `testuser${timestamp}`

        await registerPage.register(email, 'password123', username)
        await expect(page).toHaveURL('/dashboard')
    })

    test('should login existing user', async ({ page }) => {
        const loginPage = new LoginPage(page)
        await loginPage.goto()
        await loginPage.login('bob@focalboard.dev', 'demo1234')
        await expect(page).toHaveURL('/dashboard')
    })

    test('should show error for invalid credentials', async ({ page }) => {
        const loginPage = new LoginPage(page)
        await loginPage.goto()

        // Fill form and submit
        await page.getByPlaceholder('Username').fill('invaliduser')
        await page.getByPlaceholder('Password').fill('wrongpassword')
        await page.getByRole('button', { name: /log in/i }).click()

        // Check for error message
        await expect(page.locator('text=/Invalid|error|failed|Login failed/i')).toBeVisible()
    })

    test('should logout user', async ({ page }) => {
        // Login first
        const loginPage = new LoginPage(page)
        await loginPage.goto()
        await loginPage.login('bob@focalboard.dev', 'demo1234')
        await expect(page).toHaveURL('/dashboard')

        // Logout
        const dashboard = new DashboardPage(page)
        await dashboard.logout()
        await expect(page).toHaveURL('/login')
    })

    test('should redirect to login when accessing protected route', async ({ page }) => {
        await page.goto('/dashboard')
        await expect(page).toHaveURL('/login')
    })
})
