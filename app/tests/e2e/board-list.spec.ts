import {expect} from '@playwright/test'
import {test} from './fixtures/auth.fixture'
import {BoardListPage} from './fixtures/pages/BoardListPage'

test.describe('Board List', () => {
    test('should show board list with existing boards', async ({authenticatedPage}) => {
        const boardList = new BoardListPage(authenticatedPage)
        await boardList.goto()

        const cards = await boardList.getBoardCards()
        expect(cards.length).toBeGreaterThan(0)
    })

    test('should show controls (search, filter, sort, layout)', async ({authenticatedPage}) => {
        const boardList = new BoardListPage(authenticatedPage)
        await boardList.goto()

        await expect(authenticatedPage.getByTestId('board-list-controls')).toBeVisible()
        await expect(authenticatedPage.getByTestId('board-search-input')).toBeVisible()
        await expect(authenticatedPage.getByTestId('board-filter-select')).toBeVisible()
        await expect(authenticatedPage.getByTestId('board-sort-select')).toBeVisible()
        await expect(authenticatedPage.getByTestId('layout-toggle-grid')).toBeVisible()
        await expect(authenticatedPage.getByTestId('layout-toggle-list')).toBeVisible()
    })

    test('should filter boards by search text', async ({authenticatedPage}) => {
        const boardList = new BoardListPage(authenticatedPage)
        await boardList.goto()

        const allCards = await boardList.getBoardCards()
        const totalCount = allCards.length

        // Search for something unlikely to match anything
        await boardList.search('zzznomatch')
        await expect(authenticatedPage.getByTestId('no-results-state')).toBeVisible()

        await boardList.clearSearch()
        const cards = await boardList.getBoardCards()
        expect(cards.length).toBe(totalCount)
    })

    test('should switch to list layout', async ({authenticatedPage}) => {
        const boardList = new BoardListPage(authenticatedPage)
        await boardList.goto()

        await boardList.switchToListLayout()

        const rows = await boardList.getBoardListRows()
        expect(rows.length).toBeGreaterThan(0)

        const cards = await boardList.getBoardCards()
        expect(cards.length).toBe(0)
    })

    test('should switch back to grid layout', async ({authenticatedPage}) => {
        const boardList = new BoardListPage(authenticatedPage)
        await boardList.goto()

        await boardList.switchToListLayout()
        await boardList.switchToGridLayout()

        const cards = await boardList.getBoardCards()
        expect(cards.length).toBeGreaterThan(0)
    })

    test('should star a board and show it in starred section', async ({authenticatedPage}) => {
        const boardList = new BoardListPage(authenticatedPage)
        await boardList.goto()

        // Get the title of the first visible board card
        const cards = await boardList.getBoardCards()
        expect(cards.length).toBeGreaterThan(0)
        const title = await cards[0].getByRole('heading').textContent()
        expect(title).toBeTruthy()

        // Star that board
        await boardList.starBoard(title!)

        // Switch to starred filter and verify
        await boardList.setFilter('starred')
        await expect(boardList.getSection('section-starred')).toBeVisible()
        await expect(boardList.getSection('section-starred')).toContainText(title!)

        // Unstar to clean up (so test is idempotent)
        await boardList.starBoard(title!)
    })

    test('should show board context menu', async ({authenticatedPage}) => {
        const boardList = new BoardListPage(authenticatedPage)
        await boardList.goto()

        const cards = await boardList.getBoardCards()
        expect(cards.length).toBeGreaterThan(0)

        // Get first board title
        const title = await cards[0].getByRole('heading').textContent()
        expect(title).toBeTruthy()

        await boardList.openContextMenu(title!)
        await expect(authenticatedPage.getByTestId('board-context-menu')).toBeVisible()
        await expect(authenticatedPage.getByTestId('context-menu-open')).toBeVisible()
        await expect(authenticatedPage.getByTestId('context-menu-star')).toBeVisible()
        await expect(authenticatedPage.getByTestId('context-menu-copy')).toBeVisible()
        await expect(authenticatedPage.getByTestId('context-menu-delete')).toBeVisible()
    })

    test('should filter to starred shows no section when nothing starred', async ({authenticatedPage}) => {
        const boardList = new BoardListPage(authenticatedPage)
        await boardList.goto()

        // Switch to starred filter when user has nothing starred
        await boardList.setFilter('starred')

        // No starred section should be visible (BoardListSection returns null when empty)
        const section = boardList.getSection('section-starred')
        await expect(section).not.toBeVisible()

        // Controls should still be visible
        await expect(authenticatedPage.getByTestId('board-list-controls')).toBeVisible()
    })

    test('should navigate to board when card is clicked', async ({authenticatedPage}) => {
        const boardList = new BoardListPage(authenticatedPage)
        await boardList.goto()

        const cards = await boardList.getBoardCards()
        expect(cards.length).toBeGreaterThan(0)
        await cards[0].getByTestId('board-card-link').click()
        await expect(authenticatedPage).toHaveURL(/\/board\/.+/)
    })

    test('should show My Boards section when filtering by mine', async ({authenticatedPage}) => {
        const boardList = new BoardListPage(authenticatedPage)
        await boardList.goto()

        await boardList.setFilter('mine')

        // Should show the mine section (bob has API Development board)
        await expect(boardList.getSection('section-mine')).toBeVisible()
    })

    test('sidebar should show All Boards link', async ({authenticatedPage}) => {
        await authenticatedPage.goto('/dashboard')
        await expect(authenticatedPage.getByText('All Boards').first()).toBeVisible()
    })

    test('should sort boards by name A-Z', async ({authenticatedPage}) => {
        const boardList = new BoardListPage(authenticatedPage)
        await boardList.goto()

        await boardList.setSort('name-asc')

        const cards = await boardList.getBoardCards()
        expect(cards.length).toBeGreaterThan(1)

        // Get titles of first two cards and verify alphabetical order
        const title1 = await cards[0].getByRole('heading').textContent()
        const title2 = await cards[1].getByRole('heading').textContent()
        expect(title1!.localeCompare(title2!)).toBeLessThanOrEqual(0)
    })
})
