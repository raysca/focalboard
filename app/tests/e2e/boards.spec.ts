import { test, expect } from './fixtures/auth.fixture'
import { DashboardPage } from './fixtures/pages/DashboardPage'
import { BoardPage } from './fixtures/pages/BoardPage'

test.describe('Boards', () => {
    test('should create new board', async ({ authenticatedPage }) => {
        const dashboard = new DashboardPage(authenticatedPage)
        await dashboard.goto()

        // Create board with unique name
        const timestamp = Date.now()
        const boardTitle = `Test Board ${timestamp}`

        await dashboard.createBoard(boardTitle)
        await expect(authenticatedPage).toHaveURL(/\/board\/.+/)

        // Verify board title is displayed
        await expect(authenticatedPage.locator('h1')).toContainText(boardTitle)
    })

    test('should display existing boards', async ({ authenticatedPage }) => {
        const dashboard = new DashboardPage(authenticatedPage)
        await dashboard.goto()

        // Check that Product Launch board exists (from seed data)
        const board = await dashboard.getBoardByTitle('Product Launch')
        await expect(board).toBeVisible()
    })

    test('should navigate to board when clicked', async ({ authenticatedPage }) => {
        const dashboard = new DashboardPage(authenticatedPage)
        await dashboard.goto()

        // Click on Product Launch board
        const board = await dashboard.getBoardByTitle('Product Launch')
        await board.click()

        // Should navigate to board page
        await expect(authenticatedPage).toHaveURL(/\/board\/.+/)
    })

    test('should delete board', async ({ authenticatedPage }) => {
        const dashboard = new DashboardPage(authenticatedPage)
        await dashboard.goto()

        // Create a board to delete
        const timestamp = Date.now()
        const boardTitle = `Board to Delete ${timestamp}`
        await dashboard.createBoard(boardTitle)

        // Delete the board
        const boardPage = new BoardPage(authenticatedPage)
        await boardPage.deleteBoard()

        // Should redirect to dashboard
        await expect(authenticatedPage).toHaveURL('/dashboard')

        // Board should no longer be visible
        const board = await dashboard.getBoardByTitle(boardTitle)
        await expect(board).not.toBeVisible()
    })
})
