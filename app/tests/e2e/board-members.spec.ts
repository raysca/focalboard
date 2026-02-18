import {expect} from '@playwright/test'
import {test} from './fixtures/auth.fixture'
import {BoardMembersPage} from './fixtures/pages/BoardMembersPage'
import type {Page} from '@playwright/test'

async function gotoProductLaunchBoard(page: Page): Promise<BoardMembersPage> {
    await page.goto('/boards')
    await page.getByTestId('board-card').filter({hasText: 'Product Launch'}).getByTestId('board-card-link').first().click()
    await page.waitForURL(/\/board\/.+/)
    return new BoardMembersPage(page)
}

// Creates a fresh isolated board via direct API call (fast) — avoids cross-browser parallel conflicts
async function createFreshBoard(page: Page): Promise<BoardMembersPage> {
    const boardId = await page.evaluate(async () => {
        const res = await fetch('/api/v2/boards', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify({
                teamId: 'team-engineering',
                title: `TestBoard-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
                type: 'O',
            }),
        })
        const data = await res.json() as {id: string}
        return data.id
    })
    await page.goto(`/board/${boardId}`)
    await page.waitForURL(/\/board\/.+/)
    return new BoardMembersPage(page)
}

test.describe('Board Members', () => {
    test('admin can open members dialog', async ({adminPage}) => {
        const boardPage = await gotoProductLaunchBoard(adminPage)
        await boardPage.openMembersDialog()
        await expect(adminPage.getByTestId('members-dialog')).toBeVisible()
    })

    test('members dialog shows existing members', async ({adminPage}) => {
        const boardPage = await gotoProductLaunchBoard(adminPage)
        await boardPage.openMembersDialog()

        const rows = await boardPage.getMemberRows()
        expect(rows.length).toBeGreaterThan(0)
    })

    test('admin sees search input and add button', async ({adminPage}) => {
        const boardPage = await gotoProductLaunchBoard(adminPage)
        await boardPage.openMembersDialog()

        await expect(adminPage.getByTestId('member-search-input')).toBeVisible()
        await expect(adminPage.getByTestId('member-add-button')).toBeVisible()
    })

    test('non-admin does not see add member controls', async ({authenticatedPage}) => {
        // Bob is editor on Product Launch, not admin
        const boardPage = await gotoProductLaunchBoard(authenticatedPage)
        await boardPage.openMembersDialog()

        await expect(authenticatedPage.getByTestId('member-search-input')).not.toBeVisible()
        await expect(authenticatedPage.getByTestId('member-add-button')).not.toBeVisible()
    })

    test('current user row shows (you) indicator', async ({adminPage}) => {
        const boardPage = await gotoProductLaunchBoard(adminPage)
        await boardPage.openMembersDialog()
        await expect(adminPage.getByTestId('members-dialog')).toContainText('(you)')
    })

    test('leave board button is visible', async ({authenticatedPage}) => {
        // Bob is a member of Product Launch — leave button should appear
        const boardPage = await gotoProductLaunchBoard(authenticatedPage)
        await boardPage.openMembersDialog()
        await expect(authenticatedPage.getByTestId('leave-board-button')).toBeVisible()
    })

    test('non-admin member rows show read-only role (no dropdown)', async ({authenticatedPage}) => {
        const boardPage = await gotoProductLaunchBoard(authenticatedPage)
        await boardPage.openMembersDialog()

        // No role selects should be visible for non-admin
        const roleSelects = authenticatedPage.getByTestId('member-role-select')
        expect(await roleSelects.count()).toBe(0)
    })

    test('admin can search and add a new member', async ({adminPage}) => {
        // Fresh board — only alice is a member, bob can be added without conflict
        const boardPage = await createFreshBoard(adminPage)
        await boardPage.openMembersDialog()

        const countBefore = (await boardPage.getMemberRows()).length

        await boardPage.addMember('bob')

        const countAfter = (await boardPage.getMemberRows()).length
        expect(countAfter).toBeGreaterThan(countBefore)
    })

    test('admin can change a member role', async ({adminPage}) => {
        // Fresh board — add bob, change his role, restore it
        const boardPage = await createFreshBoard(adminPage)
        await boardPage.openMembersDialog()
        await boardPage.addMember('bob')

        // Change bob to commenter
        await boardPage.changeRole('bob', 'commenter')

        const bobRow = adminPage.getByTestId('member-row').filter({hasText: 'bob'})
        await expect(bobRow.getByTestId('member-role-select')).toHaveValue('commenter')

        // Restore to editor
        await boardPage.changeRole('bob', 'editor')
    })

    test('sole admin sees disabled leave message instead of leave button', async ({adminPage}) => {
        // Fresh board — alice is the only admin, so leave button must not appear
        const boardPage = await createFreshBoard(adminPage)
        await boardPage.openMembersDialog()

        await expect(adminPage.getByTestId('leave-board-button')).not.toBeVisible()
        await expect(adminPage.getByTestId('leave-board-disabled')).toBeVisible()
        await expect(adminPage.getByTestId('leave-board-disabled')).toContainText('Assign another admin')
    })

    test('admin can remove a member', async ({adminPage}) => {
        // Fresh board — add bob then remove him
        const boardPage = await createFreshBoard(adminPage)
        await boardPage.openMembersDialog()

        await boardPage.addMember('bob')
        const countAfterAdd = (await boardPage.getMemberRows()).length

        await boardPage.removeMember('bob')

        await adminPage.waitForTimeout(500)
        const countAfterRemove = (await boardPage.getMemberRows()).length
        expect(countAfterRemove).toBeLessThan(countAfterAdd)
    })
})
