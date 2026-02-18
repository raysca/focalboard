import type {Locator} from '@playwright/test'
import {BoardPage} from './BoardPage'

export class BoardMembersPage extends BoardPage {
    async openMembersDialog() {
        await this.page.getByTestId('members-button').click()
        await this.page.waitForSelector('[data-testid="members-dialog"]')
        // Wait for loading to complete — creator is always a member so member-row will appear
        await this.page.waitForSelector('[data-testid="member-row"]', {timeout: 10000})
    }

    async getMemberRows(): Promise<Locator[]> {
        return this.page.getByTestId('member-row').all()
    }

    async searchUser(query: string) {
        await this.page.getByTestId('member-search-input').fill(query)
        // Wait for search results to appear in the dropdown
        await this.page.waitForSelector('[data-testid="member-search-result"]', {timeout: 10000})
    }

    async selectSearchResult(username: string) {
        await this.page.getByTestId('member-search-result').filter({hasText: username}).click()
    }

    async addMember(username: string) {
        await this.searchUser(username)
        await this.selectSearchResult(username)
        await this.page.getByTestId('member-add-button').click()
        // Wait for member list to refresh
        await this.page.waitForTimeout(600)
    }

    async changeRole(memberName: string, role: 'admin' | 'editor' | 'commenter' | 'viewer') {
        const row = this.page.getByTestId('member-row').filter({hasText: memberName})
        await row.getByTestId('member-role-select').selectOption(role)
        await this.page.waitForTimeout(400)
    }

    async removeMember(memberName: string) {
        const row = this.page.getByTestId('member-row').filter({hasText: memberName})
        await row.getByTestId('member-remove-button').click()
        await this.page.waitForTimeout(600)
    }

    async leaveBoard() {
        await this.page.getByTestId('leave-board-button').click()
    }
}
