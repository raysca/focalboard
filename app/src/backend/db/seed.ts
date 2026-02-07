/**
 * Database seed script
 * Creates the default team, a demo user, and a realistic project board.
 *
 * Usage: bun src/backend/db/seed.ts
 */

import {migrate} from 'drizzle-orm/bun-sqlite/migrator'
import {db} from './index.ts'
import {teams, boards, blocks, boardMembers, user, account, userProfiles} from './schema.ts'
import {eq} from 'drizzle-orm'

// Run migrations first
migrate(db, {migrationsFolder: './src/backend/db/migrations'})

const now = Date.now()

// 1. Insert default team (ID "0") if it doesn't exist
const existingTeam = db.select().from(teams).get()
if (!existingTeam) {
    db.insert(teams).values({
        id: '0',
        title: 'Default',
        signupToken: '',
        settings: {},
        modifiedBy: 'system',
        updateAt: now,
    }).run()
    console.log('✅ Created default team (id: 0)')
} else {
    console.log('ℹ️  Default team already exists')
}

// 2. Check if demo user exists; create if not
const DEMO_USER_ID = 'seed-demo-user'
const existingUser = db.select().from(user).where(eq(user.id, DEMO_USER_ID)).get()
if (!existingUser) {
    // Create user in Better Auth's user table
    db.insert(user).values({
        id: DEMO_USER_ID,
        name: 'demo',
        email: 'demo@example.com',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    }).run()

    // Create account (email+password) with bcrypt-hashed "demo1234"
    const hashedPassword = await Bun.password.hash('demo1234', {algorithm: 'bcrypt', cost: 10})
    db.insert(account).values({
        id: crypto.randomUUID(),
        accountId: DEMO_USER_ID,
        providerId: 'credential',
        userId: DEMO_USER_ID,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
    }).run()

    // Create user profile
    db.insert(userProfiles).values({
        userId: DEMO_USER_ID,
        username: 'demo',
        nickname: 'Demo User',
        firstName: 'Demo',
        lastName: 'User',
        roles: 'system_user',
        createAt: now,
        updateAt: now,
    }).run()

    console.log('✅ Created demo user (demo@example.com / demo1234)')
} else {
    console.log('ℹ️  Demo user already exists')
}

// 3. Create a realistic "Product Launch" board
const BOARD_ID = 'seed-product-launch'
const existingBoard = db.select().from(boards).where(eq(boards.id, BOARD_ID)).get()
if (existingBoard) {
    console.log('ℹ️  Demo board already exists, skipping')
    process.exit(0)
}

// Property IDs
const statusPropId = crypto.randomUUID()
const priorityPropId = crypto.randomUUID()
const assigneePropId = crypto.randomUUID()
const dueDatePropId = crypto.randomUUID()

// Option IDs for status
const statusTodoId = crypto.randomUUID()
const statusInProgressId = crypto.randomUUID()
const statusDoneId = crypto.randomUUID()

// Option IDs for priority
const priorityHighId = crypto.randomUUID()
const priorityMediumId = crypto.randomUUID()
const priorityLowId = crypto.randomUUID()

const cardProperties = [
    {
        id: statusPropId,
        name: 'Status',
        type: 'select',
        options: [
            {id: statusTodoId, value: 'To Do', color: 'default'},
            {id: statusInProgressId, value: 'In Progress', color: 'yellow'},
            {id: statusDoneId, value: 'Done', color: 'green'},
        ],
    },
    {
        id: priorityPropId,
        name: 'Priority',
        type: 'select',
        options: [
            {id: priorityHighId, value: 'High', color: 'red'},
            {id: priorityMediumId, value: 'Medium', color: 'orange'},
            {id: priorityLowId, value: 'Low', color: 'blue'},
        ],
    },
    {
        id: assigneePropId,
        name: 'Assignee',
        type: 'text',
        options: [],
    },
    {
        id: dueDatePropId,
        name: 'Due Date',
        type: 'date',
        options: [],
    },
]

// Insert the board
db.insert(boards).values({
    id: BOARD_ID,
    teamId: '0',
    createdBy: DEMO_USER_ID,
    modifiedBy: DEMO_USER_ID,
    type: 'private',
    title: 'Product Launch 🚀',
    description: 'Track all tasks for the upcoming product launch.',
    icon: '🚀',
    showDescription: true,
    isTemplate: false,
    cardProperties,
    createAt: now,
    updateAt: now,
}).run()

// Add board member
db.insert(boardMembers).values({
    boardId: BOARD_ID,
    userId: DEMO_USER_ID,
    roles: '',
    schemeAdmin: true,
    schemeEditor: true,
}).run()

console.log('✅ Created "Product Launch 🚀" board')

// 4. Create views
const viewId = crypto.randomUUID()
const tableViewId = crypto.randomUUID()

const viewBlocks = [
    {
        id: viewId,
        boardId: BOARD_ID,
        parentId: BOARD_ID,
        createdBy: DEMO_USER_ID,
        modifiedBy: DEMO_USER_ID,
        type: 'view',
        title: 'Board',
        schema: 1,
        fields: {
            viewType: 'board',
            groupById: statusPropId,
            visiblePropertyIds: [priorityPropId, assigneePropId],
            sortOptions: [],
            filter: {operation: 'and', filters: []},
            cardOrder: [],
            collapsedOptionIds: [],
            hiddenOptionIds: [],
            columnWidths: {},
        },
        createAt: now,
        updateAt: now,
    },
    {
        id: tableViewId,
        boardId: BOARD_ID,
        parentId: BOARD_ID,
        createdBy: DEMO_USER_ID,
        modifiedBy: DEMO_USER_ID,
        type: 'view',
        title: 'Table',
        schema: 1,
        fields: {
            viewType: 'table',
            visiblePropertyIds: [statusPropId, priorityPropId, assigneePropId, dueDatePropId],
            sortOptions: [],
            filter: {operation: 'and', filters: []},
            cardOrder: [],
            columnWidths: {
                [statusPropId]: 120,
                [priorityPropId]: 100,
                [assigneePropId]: 120,
                [dueDatePropId]: 120,
            },
        },
        createAt: now,
        updateAt: now,
    },
]

// 5. Create cards across all columns
const cardData = [
    // To Do cards
    {title: 'Design landing page mockups', icon: '🎨', status: statusTodoId, priority: priorityHighId, assignee: 'Alice'},
    {title: 'Write API documentation', icon: '📝', status: statusTodoId, priority: priorityMediumId, assignee: 'Bob'},
    {title: 'Create onboarding email sequence', icon: '📧', status: statusTodoId, priority: priorityLowId, assignee: 'Carol'},
    {title: 'Set up error monitoring (Sentry)', icon: '🐛', status: statusTodoId, priority: priorityHighId, assignee: 'Dave'},

    // In Progress cards
    {title: 'Build authentication flow', icon: '🔐', status: statusInProgressId, priority: priorityHighId, assignee: 'Alice'},
    {title: 'Implement payment integration', icon: '💳', status: statusInProgressId, priority: priorityHighId, assignee: 'Bob'},
    {title: 'Configure CI/CD pipeline', icon: '⚙️', status: statusInProgressId, priority: priorityMediumId, assignee: 'Dave'},

    // Done cards
    {title: 'Set up project repository', icon: '📁', status: statusDoneId, priority: priorityHighId, assignee: 'Dave'},
    {title: 'Define product requirements', icon: '📋', status: statusDoneId, priority: priorityHighId, assignee: 'Alice'},
    {title: 'Choose tech stack', icon: '🏗️', status: statusDoneId, priority: priorityMediumId, assignee: 'Bob'},
    {title: 'Design database schema', icon: '🗄️', status: statusDoneId, priority: priorityHighId, assignee: 'Carol'},
]

const cardBlocks = cardData.map((card, i) => ({
    id: crypto.randomUUID(),
    boardId: BOARD_ID,
    parentId: BOARD_ID,
    createdBy: DEMO_USER_ID,
    modifiedBy: DEMO_USER_ID,
    type: 'card',
    title: card.title,
    schema: 1,
    fields: {
        icon: card.icon,
        properties: {
            [statusPropId]: card.status,
            [priorityPropId]: card.priority,
            [assigneePropId]: card.assignee,
        },
        contentOrder: [],
        isTemplate: false,
    },
    createAt: now + i,
    updateAt: now + i,
}))

// Insert all blocks (views + cards)
const allBlocks = [...viewBlocks, ...cardBlocks]
for (const block of allBlocks) {
    db.insert(blocks).values(block).run()
}

console.log(`✅ Created ${viewBlocks.length} views and ${cardBlocks.length} cards`)
console.log('')
console.log('🎉 Seed complete! You can now:')
console.log('   1. Run: bun dev')
console.log('   2. Log in with: demo@example.com / demo1234')
console.log('   3. Open the "Product Launch 🚀" board')
