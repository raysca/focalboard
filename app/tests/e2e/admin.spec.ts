import { test as authenticatedTest, expect } from './fixtures/auth.fixture'
import { AdminPage } from './fixtures/pages/AdminPage'

authenticatedTest.describe('Admin Settings', () => {
    authenticatedTest.describe('Access Control', () => {
        authenticatedTest('should redirect non-admin users to dashboard', async ({ authenticatedPage }) => {
            // Regular user (Bob) tries to access admin settings
            await authenticatedPage.goto('/admin/settings')

            // Should be redirected to dashboard
            await expect(authenticatedPage).toHaveURL('/dashboard')
        })

        authenticatedTest('should allow admin users to access admin panel', async ({ adminPage }) => {
            const admin = new AdminPage(adminPage)
            await admin.goto()

            // Should remain on admin settings page
            await expect(adminPage).toHaveURL('/admin/settings')

            // Should display admin settings heading
            const heading = await admin.getHeading()
            await expect(heading).toHaveText('Admin Settings')
        })

        authenticatedTest('should block non-admin API access', async ({ authenticatedPage }) => {
            // Regular user tries to call admin API directly
            const response = await authenticatedPage.request.get('/api/v2/admin/settings', {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })

            // Should return 403 Forbidden
            expect(response.status()).toBe(403)
        })

        authenticatedTest('should allow admin API access', async ({ adminPage }) => {
            // Admin user calls admin API
            const response = await adminPage.request.get('/api/v2/admin/settings', {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })

            // Should return 200 OK
            expect(response.status()).toBe(200)

            // Should return settings data
            const data = await response.json()
            expect(data).toHaveProperty('settings')
            expect(Array.isArray(data.settings)).toBe(true)
        })
    })

    authenticatedTest.describe('Admin Panel Display', () => {
        authenticatedTest('should display all admin tabs', async ({ adminPage }) => {
            const admin = new AdminPage(adminPage)
            await admin.goto()

            // Verify all tabs are present
            await expect(adminPage.getByRole('button', { name: /authentication/i })).toBeVisible()
            await expect(adminPage.getByRole('button', { name: /permissions/i })).toBeVisible()
            await expect(adminPage.getByRole('button', { name: /files/i })).toBeVisible()
            await expect(adminPage.getByRole('button', { name: /integrations/i })).toBeVisible()
            await expect(adminPage.getByRole('button', { name: /system/i })).toBeVisible()
            await expect(adminPage.getByRole('button', { name: /users/i })).toBeVisible()
        })

        authenticatedTest('should display authentication settings', async ({ adminPage }) => {
            const admin = new AdminPage(adminPage)
            await admin.goto()

            // Verify authentication settings section is displayed
            await expect(adminPage.getByRole('heading', { name: /authentication settings/i })).toBeVisible()

            // Verify save button is present
            await expect(adminPage.getByRole('button', { name: /save.*changes/i })).toBeVisible()
        })

        authenticatedTest('should display page description', async ({ adminPage }) => {
            const admin = new AdminPage(adminPage)
            await admin.goto()

            // Verify descriptive text is present
            await expect(adminPage.getByText(/manage application-wide settings/i)).toBeVisible()
        })
    })

    authenticatedTest.describe('Settings Management', () => {
        authenticatedTest('should load authentication settings from API', async ({ adminPage }) => {
            const admin = new AdminPage(adminPage)
            await admin.goto()

            // Wait for settings to load (should not show loading state after a moment)
            await expect(adminPage.getByText(/loading/i)).not.toBeVisible({ timeout: 5000 })

            // Should display the settings container
            await expect(adminPage.locator('.bg-white.rounded-lg.shadow')).toBeVisible()
        })

        authenticatedTest('should navigate between tabs', async ({ adminPage }) => {
            const admin = new AdminPage(adminPage)
            await admin.goto()

            // Default tab is Authentication
            await expect(adminPage.getByRole('heading', { name: /authentication settings/i })).toBeVisible()

            // Click Users tab
            await adminPage.getByRole('button', { name: /users/i }).click()

            // Should show Users content (header changes)
            await expect(adminPage.getByRole('heading', { name: /user management/i })).toBeVisible()

            // Click back to Authentication
            await adminPage.getByRole('button', { name: /authentication/i }).click()

            // Should show Authentication content again
            await expect(adminPage.getByRole('heading', { name: /authentication settings/i })).toBeVisible()
        })

        authenticatedTest('should display save button with correct states', async ({ adminPage }) => {
            const admin = new AdminPage(adminPage)
            await admin.goto()

            const saveButton = adminPage.getByRole('button', { name: /save.*changes/i })

            // Save button should be visible and enabled
            await expect(saveButton).toBeVisible()
            await expect(saveButton).toBeEnabled()
        })
    })

    authenticatedTest.describe('Security', () => {
        authenticatedTest('should not leak admin settings to regular users', async ({ authenticatedPage }) => {
            // Try to access admin settings API as regular user
            const response = await authenticatedPage.request.get('/api/v2/admin/settings?category=auth', {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })

            // Should be forbidden
            expect(response.status()).toBe(403)
        })

        authenticatedTest('should require authentication for admin panel', async ({ page }) => {
            // Unauthenticated user tries to access admin settings
            await page.goto('/admin/settings')

            // Should redirect to login
            await expect(page).toHaveURL(/\/login/)
        })

        authenticatedTest('should not expose admin routes in navigation for non-admin', async ({ authenticatedPage }) => {
            await authenticatedPage.goto('/dashboard')

            // Admin link should not be visible to regular users
            const adminLink = authenticatedPage.getByRole('link', { name: /admin/i })
            await expect(adminLink).not.toBeVisible()
        })
    })
})
