import {test, expect} from './fixtures/auth.fixture'
import {DashboardPage} from './fixtures/pages/DashboardPage'

test.describe('Board Creation', () => {
    test('should validate empty title', async ({authenticatedPage}) => {
        const dashboard = new DashboardPage(authenticatedPage)
        await dashboard.goto()

        // Open creation dialog
        await authenticatedPage.getByRole('button', {name: /create.*board/i}).first().click()
        await expect(authenticatedPage.getByRole('heading', {name: 'Create New Board'})).toBeVisible()

        // Check if Create button is disabled initially
        const createBtn = authenticatedPage.getByTestId('create-board-submit')
        const input = authenticatedPage.getByTestId('board-title-input')

        await input.fill('') // Ensure empty
        await expect(createBtn).toBeDisabled()

        // Type whitespace and check it's still disabled
        await input.fill('   ')
        await expect(createBtn).toBeDisabled()
    })

    test('should create a public workspace board', async ({authenticatedPage}) => {
        const dashboard = new DashboardPage(authenticatedPage)
        await dashboard.goto()

        // Open creation dialog
        await authenticatedPage.getByRole('button', {name: /create.*board/i}).first().click()
        await expect(authenticatedPage.getByRole('heading', {name: 'Create New Board'})).toBeVisible()

        // Fill title
        const title = `Public Board ${Date.now()}`
        await authenticatedPage.getByTestId('board-title-input').fill(title)

        // Select Workspace visibility (default, but clicking to be sure)
        await authenticatedPage.getByTestId('visibility-workspace').click()

        // Create
        await authenticatedPage.getByTestId('create-board-submit').click()

        // Verify navigation
        await expect(authenticatedPage).toHaveURL(/\/board\/.+/)

        // Verify title on board page
        await expect(authenticatedPage.getByText(title).first()).toBeVisible()
    })

    test('should create a private board', async ({authenticatedPage}) => {
        const dashboard = new DashboardPage(authenticatedPage)
        await dashboard.goto()

        // Open creation dialog
        await authenticatedPage.getByRole('button', {name: /create.*board/i}).first().click()
        await expect(authenticatedPage.getByRole('heading', {name: 'Create New Board'})).toBeVisible()

        // Fill title
        const title = `Private Board ${Date.now()}`
        await authenticatedPage.getByTestId('board-title-input').fill(title)

        // Select Private visibility
        await authenticatedPage.getByTestId('visibility-private').click()

        // Create
        await authenticatedPage.getByTestId('create-board-submit').click()

        // Verify navigation
        await expect(authenticatedPage).toHaveURL(/\/board\/.+/)

        // Verify title on board page
        await expect(authenticatedPage.getByText(title).first()).toBeVisible()
    })

    test('should create board with description and icon', async ({authenticatedPage}) => {
        const dashboard = new DashboardPage(authenticatedPage)
        await dashboard.goto()

        // Open creation dialog
        await authenticatedPage.getByRole('button', {name: /create.*board/i}).first().click()
        await expect(authenticatedPage.getByRole('heading', {name: 'Create New Board'})).toBeVisible()

        // Fill title
        const title = `Icon Board ${Date.now()}`
        await authenticatedPage.getByTestId('board-title-input').fill(title)

        // Fill description - assuming id="description" helps finding by label or use simple placeholder
        await authenticatedPage.getByPlaceholder(/what's this board for?/i).fill('This is a test description')

        // Create
        await authenticatedPage.getByTestId('create-board-submit').click()

        // Verify navigation
        await expect(authenticatedPage).toHaveURL(/\/board\/.+/)

        // Verify title on board page
        await expect(authenticatedPage.getByText(title).first()).toBeVisible()
    })
})
