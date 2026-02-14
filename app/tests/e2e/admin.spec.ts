import { test as authenticatedTest, expect } from './fixtures/auth.fixture'
import { test as baseTest } from '@playwright/test'
import { AdminPage } from './fixtures/pages/AdminPage'

authenticatedTest.describe('Admin Settings', () => {
    authenticatedTest('should access admin panel as admin', async ({ adminPage }) => {
        const admin = new AdminPage(adminPage)
        await admin.goto()

        const heading = await admin.getHeading()
        await expect(heading).toHaveText('Admin Settings')
    })

    authenticatedTest('should not access admin panel as regular user', async ({ authenticatedPage }) => {
        await authenticatedPage.goto('/admin/settings')

        // Should redirect to dashboard (or show forbidden message)
        await expect(authenticatedPage).toHaveURL('/dashboard')
    })

    authenticatedTest('should display authentication settings', async ({ adminPage }) => {
        const admin = new AdminPage(adminPage)
        await admin.goto()

        // Verify authentication settings section is displayed
        await expect(adminPage.getByRole('heading', { name: /authentication settings/i })).toBeVisible()

        // Verify save button is present
        await expect(adminPage.getByRole('button', { name: /save.*changes/i })).toBeVisible()
    })
})
