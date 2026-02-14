import { test, expect } from './fixtures/auth.fixture'
import { DashboardPage } from './fixtures/pages/DashboardPage'
import { BoardPage } from './fixtures/pages/BoardPage'

test.describe('Cards', () => {
    test('should create new card', async ({ authenticatedPage }) => {
        // Navigate to Product Launch board
        const dashboard = new DashboardPage(authenticatedPage)
        await dashboard.goto()

        const board = await dashboard.getBoardByTitle('Product Launch')
        await board.click()

        // Get initial card count
        const initialCards = await authenticatedPage.locator('[data-testid="card"]').count()

        // Create new card (creates with empty title)
        const boardPage = new BoardPage(authenticatedPage)
        await boardPage.createCard()

        // Verify a new card was added
        const newCardCount = await authenticatedPage.locator('[data-testid="card"]').count()
        await expect(newCardCount).toBeGreaterThan(initialCards)
    })

    test('should display existing cards', async ({ authenticatedPage }) => {
        // Navigate to Product Launch board
        const dashboard = new DashboardPage(authenticatedPage)
        await dashboard.goto()

        const board = await dashboard.getBoardByTitle('Product Launch')
        await board.click()

        // Check that seed data cards exist
        const boardPage = new BoardPage(authenticatedPage)
        const card = await boardPage.getCardByTitle('Design hero section for landing page')
        await expect(card).toBeVisible()
    })

    test.skip('should edit card title', async ({ authenticatedPage }) => {
        // Navigate to Product Launch board
        const dashboard = new DashboardPage(authenticatedPage)
        await dashboard.goto()

        const board = await dashboard.getBoardByTitle('Product Launch')
        await board.click()

        // Click on existing card
        const boardPage = new BoardPage(authenticatedPage)
        const card = await boardPage.getCardByTitle('Design landing page')
        await card.click()

        // Edit title (implementation may vary based on actual UI)
        const titleInput = authenticatedPage.locator('[data-testid="card-detail-title"]')
        await titleInput.fill('Updated landing page design')

        // Close card detail
        await authenticatedPage.keyboard.press('Escape')

        // Verify updated title
        const updatedCard = await boardPage.getCardByTitle('Updated landing page design')
        await expect(updatedCard).toBeVisible()
    })
})
