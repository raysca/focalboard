import type {Page, Locator} from '@playwright/test'
import {BasePage} from './BasePage'

export class BoardListPage extends BasePage {
    constructor(page: Page) {
        super(page)
    }

    async goto() {
        await this.page.goto('/boards')
        await this.page.waitForSelector('[data-testid="board-list-controls"], [data-testid="empty-state"]')
    }

    async search(term: string) {
        await this.page.getByTestId('board-search-input').fill(term)
    }

    async clearSearch() {
        await this.page.getByTestId('board-search-input').fill('')
    }

    async setFilter(value: 'all' | 'mine' | 'starred' | 'recent') {
        await this.page.getByTestId('board-filter-select').selectOption(value)
    }

    async setSort(value: 'activity' | 'name-asc' | 'name-desc' | 'created') {
        await this.page.getByTestId('board-sort-select').selectOption(value)
    }

    async switchToGridLayout() {
        await this.page.getByTestId('layout-toggle-grid').click()
    }

    async switchToListLayout() {
        await this.page.getByTestId('layout-toggle-list').click()
    }

    async getBoardCards(): Promise<Locator[]> {
        const cards = this.page.getByTestId('board-card')
        return await cards.all()
    }

    async getBoardListRows(): Promise<Locator[]> {
        const rows = this.page.getByTestId('board-list-row')
        return await rows.all()
    }

    async starBoard(boardTitle: string) {
        const card = this.page.getByTestId('board-card').filter({hasText: boardTitle})
        await card.hover()
        await card.getByTestId('board-star-button').click()
    }

    async openContextMenu(boardTitle: string) {
        const card = this.page.getByTestId('board-card').filter({hasText: boardTitle})
        await card.hover()
        await card.getByTestId('board-menu-button').click()
        await this.page.waitForSelector('[data-testid="board-context-menu"]')
    }

    async clickCreateBoard() {
        await this.page.getByTestId('create-board-card').click()
    }

    isEmptyState(): Locator {
        return this.page.getByTestId('empty-state')
    }

    isNoResultsState(): Locator {
        return this.page.getByTestId('no-results-state')
    }

    getSection(testId: string): Locator {
        return this.page.getByTestId(testId)
    }
}
