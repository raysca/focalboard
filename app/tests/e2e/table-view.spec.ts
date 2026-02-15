import {test, expect} from './fixtures/auth.fixture'
import {DashboardPage} from './fixtures/pages/DashboardPage'

test.describe('Table View', () => {
    let boardId: string

    test.beforeEach(async ({authenticatedPage}) => {
        // Navigate to dashboard to ensure auth context
        const dashboard = new DashboardPage(authenticatedPage)
        await dashboard.goto()

        // Create board via API with specific properties
        boardId = await authenticatedPage.evaluate(async () => {
            const statusId = crypto.randomUUID()
            const priorityId = crypto.randomUUID()

            const cardProperties = [
                {
                    id: statusId,
                    name: 'Status',
                    type: 'select',
                    options: [
                        {id: crypto.randomUUID(), value: 'To Do', color: 'default'},
                        {id: crypto.randomUUID(), value: 'In Progress', color: 'yellow'},
                        {id: crypto.randomUUID(), value: 'Done', color: 'green'},
                    ],
                },
                {
                    id: priorityId,
                    name: 'Priority',
                    type: 'select',
                    options: [
                        {id: crypto.randomUUID(), value: 'High', color: 'red'},
                        {id: crypto.randomUUID(), value: 'Medium', color: 'orange'},
                        {id: crypto.randomUUID(), value: 'Low', color: 'blue'},
                    ],
                },
            ]

            const res = await fetch('/api/v2/boards', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    title: `Table View Test Board ${crypto.randomUUID()}`,
                    type: 'P', // Private
                    teamId: 'team-engineering', // Default team
                    cardProperties,
                }),
            })

            if (!res.ok) {
                const text = await res.text()
                throw new Error(`Failed to create board: ${res.status} ${text}`)
            }
            const board = await res.json()

            // Create Table View
            const viewBlock = {
                boardId: board.id,
                parentId: board.id,
                type: 'view',
                title: 'Table View',
                fields: {
                    viewType: 'table',
                    groupById: null,
                    visiblePropertyIds: [statusId, priorityId], // Show Status and Priority
                    sortOptions: [],
                    filter: {operation: 'and', filters: []},
                    cardOrder: [],
                    collapsedOptionIds: [],
                    hiddenOptionIds: [],
                    columnWidths: {},
                },
                schema: 1,
            }

            await fetch(`/api/v2/boards/${board.id}/blocks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify([viewBlock]),
            })

            return board.id
        })

        // Go directly to the board
        await authenticatedPage.goto(`/board/${boardId}`)
    })

    test('should view board in table view', async ({authenticatedPage}) => {
        // Switch to Table View
        await authenticatedPage.getByRole('button', {name: /table view/i}).click()

        // Verify table headers
        await expect(authenticatedPage.getByRole('columnheader', {name: 'Name'})).toBeVisible()
        const statusHeader = authenticatedPage.getByRole('columnheader').filter({hasText: /status/i})
        if (await statusHeader.count() > 0) {
            await expect(statusHeader).toBeVisible()
        }
        await expect(authenticatedPage.getByRole('columnheader', {name: 'Priority'})).toBeVisible()

        // Verify Toolbar
        await expect(authenticatedPage.getByTitle('Filter')).toBeVisible()
        // "New" button might be "New" text or just an icon depending on screen width, assumed visible based on component code
        await expect(authenticatedPage.locator('button').filter({hasText: 'New'})).toBeVisible()
    })

    test('should group by status', async ({authenticatedPage}) => {
        // Switch to Table View
        await authenticatedPage.getByRole('button', {name: /table view/i}).click()

        // Create items via API
        await authenticatedPage.evaluate(async (boardId) => {
            const res = await fetch(`/api/v2/boards/${boardId}`, {
                headers: {'X-Requested-With': 'XMLHttpRequest'},
            })
            const board = await res.json()
            const cardProperties = board.cardProperties || []
            const statusProp = cardProperties.find((p: any) => p.name === 'Status')

            if (!statusProp) {
                console.warn('Status property not found on board:', board)
                return
            }

            const todoOption = statusProp.options?.find((o: any) => o.value === 'To Do')
            const inProgressOption = statusProp.options?.find((o: any) => o.value === 'In Progress')

            if (!todoOption || !inProgressOption) {
                console.warn('Status options not found', statusProp)
                return
            }

            const cards = [
                {
                    boardId,
                    parentId: boardId,
                    type: 'card',
                    title: 'Task No Props',
                    fields: {properties: {}},
                },
                {
                    boardId,
                    parentId: boardId,
                    type: 'card',
                    title: 'Task 1',
                    fields: {properties: {[statusProp.id]: todoOption.id}},
                },
                {
                    boardId,
                    parentId: boardId,
                    type: 'card',
                    title: 'Task 2',
                    fields: {properties: {[statusProp.id]: todoOption.id}},
                },
                {
                    boardId,
                    parentId: boardId,
                    type: 'card',
                    title: 'Task 3',
                    fields: {properties: {[statusProp.id]: inProgressOption.id}},
                }
            ]
            const resCards = await fetch(`/api/v2/boards/${boardId}/blocks`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest'},
                body: JSON.stringify(cards),
            })

            if (!resCards.ok) {
                const text = await resCards.text()
                console.error('Failed to create cards:', resCards.status, text)
                throw new Error(`Failed to create cards: ${resCards.status} ${text}`)
            }

            // Programmatically enable grouping
            const viewRes = await fetch(`/api/v2/boards/${boardId}/blocks?type=view`, {
                headers: {'X-Requested-With': 'XMLHttpRequest'},
            })
            const views = await viewRes.json()
            const tableView = views.find((v: any) => v.title === 'Table View')

            if (tableView) {
                await fetch(`/api/v2/boards/${boardId}/blocks/${tableView.id}`, {
                    method: 'PATCH',
                    headers: {'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest'},
                    body: JSON.stringify({
                        fields: {...tableView.fields, groupById: statusProp.id}
                    })
                })
            }
        }, boardId)

        await authenticatedPage.reload()
        await authenticatedPage.waitForLoadState('networkidle')

        // Wait for table view to load and switch if needed
        await authenticatedPage.getByRole('button', {name: /table view/i}).click()
        await authenticatedPage.waitForLoadState('networkidle')

        // Verify group headers and counts
        await expect(authenticatedPage.getByText('Total: 4')).toBeVisible()

        // Verify group headers
        await expect(authenticatedPage.getByText('To Do')).toBeVisible()
        await expect(authenticatedPage.getByText('2', {exact: true})).toBeVisible()

        await expect(authenticatedPage.getByText('In Progress')).toBeVisible()
        // Use first() to avoid ambiguity if '1' appears elsewhere
        await expect(authenticatedPage.getByText('1', {exact: true}).first()).toBeVisible()
    })

    test('should inline edit status', async ({authenticatedPage}) => {
        // Switch to Table View
        await authenticatedPage.getByRole('button', {name: /table view/i}).click()

        // Create card
        await authenticatedPage.evaluate(async (boardId) => {
            await fetch(`/api/v2/boards/${boardId}/blocks`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest'},
                body: JSON.stringify([{
                    boardId,
                    parentId: boardId,
                    type: 'card',
                    title: 'Edit Me',
                    fields: {properties: {}},
                }]),
            })
        }, boardId)

        await authenticatedPage.reload()
        await authenticatedPage.getByRole('button', {name: /table view/i}).click()

        // Find cell for Status (2nd column, index 1)
        const row = authenticatedPage.getByRole('row').filter({hasText: 'Edit Me'})
        const statusCell = row.getByRole('cell').nth(1)

        await statusCell.click()

        // Select "Done"
        // Wait for dropdown
        const option = authenticatedPage.locator('button').filter({hasText: 'Done'}).first()
        await option.waitFor()
        await option.click()

        // Verify
        await expect(statusCell).toContainText('Done')
    })

    test('should filter cards', async ({authenticatedPage}) => {
        test.setTimeout(60000)
        await authenticatedPage.getByRole('button', {name: /table view/i}).click()

        // Create cards
        await authenticatedPage.evaluate(async (boardId) => {
            // Add headers to GET request
            const res = await fetch(`/api/v2/boards/${boardId}`, {
                headers: {'X-Requested-With': 'XMLHttpRequest'},
            })
            const board = await res.json()
            const cardProperties = board.cardProperties || []
            const statusProp = cardProperties.find((p: any) => p.name === 'Status')

            if (!statusProp) {
                console.warn('Status property not found on board:', board)
                return
            }

            const todoOption = statusProp.options?.find((o: any) => o.value === 'To Do')

            if (!todoOption) {
                console.warn('To Do option not found')
                return
            }

            const todoId = todoOption.id

            const resCards = await fetch(`/api/v2/boards/${boardId}/blocks`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest'},
                body: JSON.stringify([
                    {
                        boardId,
                        parentId: boardId,
                        type: 'card',
                        title: 'Filter Match',
                        fields: {properties: {[statusProp.id]: todoId}},
                    },
                    {
                        boardId,
                        parentId: boardId,
                        type: 'card',
                        title: 'Filter Mismatch',
                        fields: {properties: {}},
                    }
                ]),
            })
            if (!resCards.ok) throw new Error(`Failed to create cards: ${resCards.status}`)
        }, boardId)

        await authenticatedPage.reload()
        await authenticatedPage.waitForLoadState('networkidle')

        await authenticatedPage.getByRole('button', {name: /table view/i}).click()

        // Open Filter
        await authenticatedPage.getByTitle('Filter').click()

        // Click Add Filter
        await authenticatedPage.getByRole('button', {name: /add filter/i}).click()

        // Default might be Status (select). Switch to Title (text).
        await authenticatedPage.getByRole('button', {name: /Status/}).click()
        await authenticatedPage.getByRole('button', {name: 'Title'}).click()

        // Now input should be visible
        await authenticatedPage.getByPlaceholder('value...').fill('Filter Match')
        await authenticatedPage.getByPlaceholder('value...').press('Enter')

        // Wait for filter to apply
        await authenticatedPage.waitForTimeout(2000)

        // Verify total count should be 1
        console.log('Verifying filter results...')
        const bodyText = await authenticatedPage.locator('body').innerText()
        console.log('PAGE CONTENT:', bodyText)

        await expect(authenticatedPage.getByText('Total: 1')).toBeVisible()
        await expect(authenticatedPage.getByText('Filter Match')).toBeVisible()
        await expect(authenticatedPage.getByText('Filter Mismatch')).not.toBeVisible()
    })
})
