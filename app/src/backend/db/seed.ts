/**
 * Database seed script - Refactored to use JSON seed data files
 * Creates teams, users, boards, cards, views, and dependencies from JSON files.
 *
 * Usage:
 *   bun src/backend/db/seed.ts           # Idempotent seeding (skips existing)
 *   bun src/backend/db/seed.ts --force   # Force full reload (clears all data first)
 */

import {migrate} from 'drizzle-orm/bun-sqlite/migrator'
import {db} from './index.ts'
import {
    teams,
    boards,
    blocks,
    boardMembers,
    user,
    account,
    userProfiles,
    cardDependencies,
    categories,
    categoryBoards,
    subscriptions,
    session,
    verification,
    boardsHistory,
    blocksHistory,
    boardMembersHistory,
    notificationHints,
    sharing,
    fileInfo,
    preferences,
    systemSettings,
    adminSettings,
    adminSettingsHistory,
} from './schema.ts'
import {eq, sql} from 'drizzle-orm'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {hashPassword, verifyPassword} from 'better-auth/crypto'

// Export the seed function for programmatic use
export async function seedDatabase(force = false) {
    const forceReload = force
    return _seedDatabase(forceReload)
}

// Internal seed implementation
async function _seedDatabase(forceReload: boolean) {

// Type definitions for seed data
interface UserSeed {
    id: string
    name: string
    email: string
    password: string
    emailVerified: boolean
    username: string
    nickname: string
    firstName: string
    lastName: string
    roles: string
    isBot: boolean
    isGuest: boolean
}

interface TeamSeed {
    id: string
    title: string
    signupToken: string
    settings: Record<string, unknown>
    modifiedBy: string
}

interface BoardSeed {
    id: string
    teamId: string
    createdBy: string
    modifiedBy: string
    type: string
    title: string
    description: string
    icon: string
    showDescription: boolean
    isTemplate: boolean
    cardProperties: Array<Record<string, unknown>>
}

interface CardSeed {
    id: string
    boardId: string
    title: string
    icon: string
    properties: Record<string, unknown>
    content?: string
}

interface ViewSeed {
    id: string
    boardId: string
    parentId: string
    createdBy: string
    title: string
    type: string
    fields: Record<string, unknown>
}

interface BoardMemberSeed {
    boardId: string
    userId: string
    roles: string
    schemeAdmin: boolean
    schemeEditor: boolean
    schemeCommenter: boolean
    schemeViewer: boolean
}

interface DependencySeed {
    sourceCardId: string
    targetCardId: string
    type: string
    boardId: string
    metadata?: Record<string, unknown>
}

interface CategorySeed {
    id: string
    name: string
    userId: string
    teamId: string
    collapsed: boolean
    sortOrder: number
    sorting: string
    type: string
    boards: string[]
}

interface SubscriptionSeed {
    blockType: string
    blockId: string
    subscriberType: string
    subscriberId: string
    notifiedAt: number
}

interface ChecklistItemSeed {
    text: string
    completed: boolean
}

interface ChecklistSeed {
    cardId: string
    items: ChecklistItemSeed[]
}

// Helper function to load JSON seed file
function loadSeedData<T>(filename: string): T[] {
    const seedsPath = join(import.meta.dir, 'seeds', filename)
    const content = readFileSync(seedsPath, 'utf-8')
    return JSON.parse(content)
}

// Run migrations first
console.log('🔄 Running migrations...')
migrate(db, {migrationsFolder: './src/backend/db/migrations'})
console.log('✅ Migrations complete\n')

// Force reload: Clear all data
if (forceReload) {
    console.log('⚠️  FORCE RELOAD MODE - Clearing all data...')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // Delete in reverse dependency order
    const tablesToClear = [
        {name: 'subscriptions', table: subscriptions},
        {name: 'category_boards', table: categoryBoards},
        {name: 'categories', table: categories},
        {name: 'card_dependencies', table: cardDependencies},
        {name: 'blocks', table: blocks},
        {name: 'blocks_history', table: blocksHistory},
        {name: 'board_members', table: boardMembers},
        {name: 'board_members_history', table: boardMembersHistory},
        {name: 'boards', table: boards},
        {name: 'boards_history', table: boardsHistory},
        {name: 'user_profiles', table: userProfiles},
        {name: 'session', table: session},
        {name: 'account', table: account},
        {name: 'user', table: user},
        {name: 'verification', table: verification},
        {name: 'teams', table: teams},
        {name: 'notification_hints', table: notificationHints},
        {name: 'sharing', table: sharing},
        {name: 'file_info', table: fileInfo},
        {name: 'preferences', table: preferences},
        {name: 'system_settings', table: systemSettings},
        {name: 'admin_settings_history', table: adminSettingsHistory},
        {name: 'admin_settings', table: adminSettings},
    ]

    for (const {name, table} of tablesToClear) {
        try {
            const result = db.delete(table).run()
            console.log(`   🗑️  Cleared ${name}: ${result.changes} records deleted`)
        } catch (error) {
            console.log(`   ⚠️  ${name}: ${error instanceof Error ? error.message : 'Error clearing table'}`)
        }
    }

    console.log('\n✅ All data cleared\n')
}

const now = Date.now()

// ==================== SEED TEAMS ====================
console.log(`📦 Seeding teams...${forceReload ? ' (force reload)' : ''}`)
const teamsData = loadSeedData<TeamSeed>('teams.json')
let teamsCreated = 0
let teamsSkipped = 0

for (const teamData of teamsData) {
    const existingTeam = forceReload ? null : db.select().from(teams).where(eq(teams.id, teamData.id)).get()
    if (!existingTeam) {
        db.insert(teams).values({
            id: teamData.id,
            title: teamData.title,
            signupToken: teamData.signupToken,
            settings: teamData.settings,
            modifiedBy: teamData.modifiedBy,
            updateAt: now,
        }).run()
        teamsCreated++
    } else {
        teamsSkipped++
    }
}
console.log(`✅ Teams: ${teamsCreated} created, ${teamsSkipped} skipped\n`)

// ==================== SEED USERS ====================
console.log(`👥 Seeding users...${forceReload ? ' (force reload)' : ''}`)
const usersData = loadSeedData<UserSeed>('users.json')
let usersCreated = 0
let usersSkipped = 0

for (const userData of usersData) {
    const existingUser = forceReload ? null : db.select().from(user).where(eq(user.id, userData.id)).get()
    if (!existingUser) {
        // Create user in Better Auth's user table
        db.insert(user).values({
            id: userData.id,
            name: userData.name,
            email: userData.email,
            emailVerified: userData.emailVerified,
            createdAt: new Date(),
            updatedAt: new Date(),
        }).run()

        // Create account (email+password) with scrypt-hashed password
        // Better Auth uses scrypt (not bcrypt) for password hashing
        // Hash format: "salt:key" where both are hex-encoded
        // This ensures compatibility with Better Auth's authentication system
        const hashedPassword = await hashPassword(userData.password)
        db.insert(account).values({
            id: crypto.randomUUID(),
            accountId: userData.id,
            providerId: 'credential',
            userId: userData.id,
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date(),
        }).run()

        // Create user profile
        db.insert(userProfiles).values({
            userId: userData.id,
            username: userData.username,
            nickname: userData.nickname,
            firstName: userData.firstName,
            lastName: userData.lastName,
            roles: userData.roles,
            isBot: userData.isBot,
            isGuest: userData.isGuest,
            createAt: now,
            updateAt: now,
        }).run()

        usersCreated++
        console.log(`   ✓ Created user: ${userData.email}`)
    } else {
        usersSkipped++
    }
}
console.log(`✅ Users: ${usersCreated} created, ${usersSkipped} skipped\n`)

// ==================== SEED BOARDS ====================
console.log(`📋 Seeding boards...${forceReload ? ' (force reload)' : ''}`)
const boardsData = loadSeedData<BoardSeed>('boards.json')
let boardsCreated = 0
let boardsSkipped = 0

for (const boardData of boardsData) {
    const existingBoard = forceReload ? null : db.select().from(boards).where(eq(boards.id, boardData.id)).get()
    if (!existingBoard) {
        db.insert(boards).values({
            id: boardData.id,
            teamId: boardData.teamId,
            createdBy: boardData.createdBy,
            modifiedBy: boardData.modifiedBy,
            type: boardData.type,
            title: boardData.title,
            description: boardData.description,
            icon: boardData.icon,
            showDescription: boardData.showDescription,
            isTemplate: boardData.isTemplate,
            cardProperties: boardData.cardProperties,
            createAt: now,
            updateAt: now,
        }).run()
        boardsCreated++
        console.log(`   ✓ Created board: ${boardData.title}`)
    } else {
        boardsSkipped++
    }
}
console.log(`✅ Boards: ${boardsCreated} created, ${boardsSkipped} skipped\n`)

// ==================== SEED BOARD MEMBERS ====================
console.log(`👤 Seeding board members...${forceReload ? ' (force reload)' : ''}`)
const boardMembersData = loadSeedData<BoardMemberSeed>('boardMembers.json')
let membersCreated = 0

for (const memberData of boardMembersData) {
    // Check if member already exists (no primary key, so check both fields)
    const existing = forceReload
        ? null
        : db
              .select()
              .from(boardMembers)
              .where(eq(boardMembers.boardId, memberData.boardId))
              .all()
              .find((m) => m.userId === memberData.userId)

    if (!existing) {
        db.insert(boardMembers).values({
            boardId: memberData.boardId,
            userId: memberData.userId,
            roles: memberData.roles,
            schemeAdmin: memberData.schemeAdmin,
            schemeEditor: memberData.schemeEditor,
            schemeCommenter: memberData.schemeCommenter,
            schemeViewer: memberData.schemeViewer,
        }).run()
        membersCreated++
    }
}
console.log(`✅ Board members: ${membersCreated} created\n`)

// ==================== SEED VIEWS ====================
console.log(`👁️  Seeding views...${forceReload ? ' (force reload)' : ''}`)
const viewsData = loadSeedData<ViewSeed>('views.json')
let viewsCreated = 0

for (const viewData of viewsData) {
    const existingView = forceReload ? null : db.select().from(blocks).where(eq(blocks.id, viewData.id)).get()
    if (!existingView) {
        db.insert(blocks).values({
            id: viewData.id,
            boardId: viewData.boardId,
            parentId: viewData.parentId,
            createdBy: viewData.createdBy,
            modifiedBy: viewData.createdBy,
            type: viewData.type,
            title: viewData.title,
            schema: 1,
            fields: viewData.fields,
            createAt: now,
            updateAt: now,
        }).run()
        viewsCreated++
    }
}
console.log(`✅ Views: ${viewsCreated} created\n`)

// ==================== SEED CARDS ====================
console.log(`🎴 Seeding cards...${forceReload ? ' (force reload)' : ''}`)
const cardsData = loadSeedData<CardSeed>('cards.json')
let cardsCreated = 0

for (const cardData of cardsData) {
    const existingCard = forceReload ? null : db.select().from(blocks).where(eq(blocks.id, cardData.id)).get()
    if (!existingCard) {
        // Get the board to find the creator
        const board = db.select().from(boards).where(eq(boards.id, cardData.boardId)).get()
        const createdBy = board?.createdBy || 'system'

        db.insert(blocks).values({
            id: cardData.id,
            boardId: cardData.boardId,
            parentId: cardData.boardId,
            createdBy,
            modifiedBy: createdBy,
            type: 'card',
            title: cardData.title,
            schema: 1,
            fields: {
                icon: cardData.icon,
                properties: cardData.properties,
                contentOrder: [],
                isTemplate: false,
            },
            createAt: now,
            updateAt: now,
        }).run()
        cardsCreated++
    }
}
console.log(`✅ Cards: ${cardsCreated} created\n`)

// ==================== SEED CHECKLIST ITEMS ====================
console.log(`☑️  Seeding checklist items...${forceReload ? ' (force reload)' : ''}`)
const checklistData = loadSeedData<ChecklistSeed>('checklistItems.json')
let checklistItemsCreated = 0

for (const checklist of checklistData) {
    // Verify card exists
    const card = db.select().from(blocks)
        .where(eq(blocks.id, checklist.cardId))
        .get()

    if (!card) {
        console.log(`   ⚠️  Skipping checklist: card not found (${checklist.cardId})`)
        continue
    }

    const contentOrder: string[] = []

    for (const item of checklist.items) {
        const blockId = crypto.randomUUID()

        db.insert(blocks).values({
            id: blockId,
            boardId: card.boardId,
            parentId: checklist.cardId,
            createdBy: card.createdBy,
            modifiedBy: card.createdBy,
            type: 'checkbox',
            title: item.text,
            schema: 1,
            fields: {value: item.completed ? 'true' : 'false'},
            createAt: now,
            updateAt: now,
            deleteAt: 0,
        }).run()

        contentOrder.push(blockId)
        checklistItemsCreated++
    }

    // Update card's contentOrder
    const existingFields = card.fields as Record<string, unknown> || {}
    db.update(blocks)
        .set({
            fields: {...existingFields, contentOrder},
            updateAt: now,
        })
        .where(eq(blocks.id, checklist.cardId))
        .run()
}

console.log(`✅ Checklist items: ${checklistItemsCreated} created\n`)

// ==================== SEED DEPENDENCIES ====================
console.log(`🔗 Seeding card dependencies...${forceReload ? ' (force reload)' : ''}`)
const dependenciesData = loadSeedData<DependencySeed>('dependencies.json')
let dependenciesCreated = 0

for (const depData of dependenciesData) {
    // Check if cards exist
    const sourceCard = db.select().from(blocks).where(eq(blocks.id, depData.sourceCardId)).get()
    const targetCard = db.select().from(blocks).where(eq(blocks.id, depData.targetCardId)).get()

    if (!sourceCard || !targetCard) {
        console.log(
            `   ⚠️  Skipping dependency: card not found (${depData.sourceCardId} -> ${depData.targetCardId})`
        )
        continue
    }

    // Check if dependency already exists
    const existing = forceReload
        ? null
        : db
              .select()
              .from(cardDependencies)
              .where(eq(cardDependencies.sourceCardId, depData.sourceCardId))
              .all()
              .find(
                  (d) =>
                      d.targetCardId === depData.targetCardId &&
                      d.dependencyType === depData.type &&
                      d.deletedAt === 0
              )

    if (!existing) {
        const depId = crypto.randomUUID()
        const inverseDep = crypto.randomUUID()

        // Get the board to find the creator
        const board = db.select().from(boards).where(eq(boards.id, depData.boardId)).get()
        const createdBy = board?.createdBy || 'system'

        // Create the main dependency
        db.insert(cardDependencies).values({
            id: depId,
            sourceCardId: depData.sourceCardId,
            targetCardId: depData.targetCardId,
            dependencyType: depData.type,
            createdBy,
            createdAt: now,
            updatedAt: now,
            deletedAt: 0,
            boardId: depData.boardId,
            metadata: depData.metadata || {},
        }).run()

        // Create inverse dependency
        const inverseType = depData.type === 'blocks' ? 'blocked_by' : depData.type
        db.insert(cardDependencies).values({
            id: inverseDep,
            sourceCardId: depData.targetCardId,
            targetCardId: depData.sourceCardId,
            dependencyType: inverseType,
            createdBy,
            createdAt: now,
            updatedAt: now,
            deletedAt: 0,
            boardId: depData.boardId,
            metadata: depData.metadata || {},
        }).run()

        dependenciesCreated += 2
    }
}
console.log(`✅ Dependencies: ${dependenciesCreated / 2} created (${dependenciesCreated} total with inverses)\n`)

// ==================== SEED CATEGORIES ====================
console.log(`📁 Seeding categories...${forceReload ? ' (force reload)' : ''}`)
const categoriesData = loadSeedData<CategorySeed>('categories.json')
let categoriesCreated = 0

for (const categoryData of categoriesData) {
    const existingCategory = forceReload
        ? null
        : db.select().from(categories).where(eq(categories.id, categoryData.id)).get()
    if (!existingCategory) {
        db.insert(categories).values({
            id: categoryData.id,
            name: categoryData.name,
            userId: categoryData.userId,
            teamId: categoryData.teamId,
            collapsed: categoryData.collapsed,
            sortOrder: categoryData.sortOrder,
            sorting: categoryData.sorting,
            type: categoryData.type,
            createAt: now,
            updateAt: now,
        }).run()

        // Create category board relationships
        categoryData.boards.forEach((boardId, index) => {
            db.insert(categoryBoards).values({
                id: crypto.randomUUID(),
                userId: categoryData.userId,
                categoryId: categoryData.id,
                boardId,
                hidden: false,
                sortOrder: index,
                createAt: now,
                updateAt: now,
            }).run()
        })

        categoriesCreated++
    }
}
console.log(`✅ Categories: ${categoriesCreated} created\n`)

// ==================== SEED SUBSCRIPTIONS ====================
console.log(`🔔 Seeding subscriptions...${forceReload ? ' (force reload)' : ''}`)
const subscriptionsData = loadSeedData<SubscriptionSeed>('subscriptions.json')
let subscriptionsCreated = 0

for (const subData of subscriptionsData) {
    // Check if subscription already exists
    const existing = forceReload
        ? null
        : db
              .select()
              .from(subscriptions)
              .where(eq(subscriptions.blockId, subData.blockId))
              .all()
              .find(
                  (s) =>
                      s.subscriberId === subData.subscriberId &&
                      s.blockType === subData.blockType &&
                      s.subscriberType === subData.subscriberType &&
                      s.deleteAt === 0
              )

    if (!existing) {
        db.insert(subscriptions).values({
            blockType: subData.blockType,
            blockId: subData.blockId,
            subscriberType: subData.subscriberType,
            subscriberId: subData.subscriberId,
            notifiedAt: subData.notifiedAt,
            createAt: now,
            deleteAt: 0,
        }).run()
        subscriptionsCreated++
    }
}
console.log(`✅ Subscriptions: ${subscriptionsCreated} created\n`)

// ==================== SEED ADMIN SETTINGS ====================
console.log(`⚙️  Seeding admin settings...${forceReload ? ' (force reload)' : ''}`)
let settingsCreated = 0

// Define default admin settings
const defaultSettings = [
    // Authentication settings
    {
        id: 'auth.signup_enabled',
        category: 'auth',
        key: 'signup_enabled',
        value: true,
        valueType: 'boolean',
        defaultValue: true,
        description: 'Allow new user registrations',
        isPublic: true,
        constraints: {},
    },
    {
        id: 'auth.signup_requires_token',
        category: 'auth',
        key: 'signup_requires_token',
        value: false,
        valueType: 'boolean',
        defaultValue: false,
        description: 'Require invite token for registration',
        isPublic: true,
        constraints: {},
    },
    {
        id: 'auth.email_verification_required',
        category: 'auth',
        key: 'email_verification_required',
        value: false,
        valueType: 'boolean',
        defaultValue: false,
        description: 'Require email verification for new users',
        isPublic: true,
        constraints: {},
    },
    {
        id: 'auth.session_timeout',
        category: 'auth',
        key: 'session_timeout',
        value: 2592000,
        valueType: 'number',
        defaultValue: 2592000,
        description: 'Session timeout in seconds (default: 30 days)',
        isPublic: false,
        constraints: {min: 3600, max: 31536000}, // 1 hour to 1 year
    },
    {
        id: 'auth.github_oauth_enabled',
        category: 'auth',
        key: 'github_oauth_enabled',
        value: true,
        valueType: 'boolean',
        defaultValue: true,
        description: 'Enable GitHub OAuth login',
        isPublic: true,
        constraints: {},
    },
    {
        id: 'auth.google_oauth_enabled',
        category: 'auth',
        key: 'google_oauth_enabled',
        value: true,
        valueType: 'boolean',
        defaultValue: true,
        description: 'Enable Google OAuth login',
        isPublic: true,
        constraints: {},
    },

    // Permissions settings
    {
        id: 'permissions.default_board_visibility',
        category: 'permissions',
        key: 'default_board_visibility',
        value: 'personal',
        valueType: 'string',
        defaultValue: 'personal',
        description: 'Default visibility for new boards',
        isPublic: false,
        constraints: {enum: ['personal', 'team', 'template']},
    },
    {
        id: 'permissions.guest_access_enabled',
        category: 'permissions',
        key: 'guest_access_enabled',
        value: false,
        valueType: 'boolean',
        defaultValue: false,
        description: 'Allow guest users to access boards',
        isPublic: false,
        constraints: {},
    },
    {
        id: 'permissions.who_can_create_boards',
        category: 'permissions',
        key: 'who_can_create_boards',
        value: 'all',
        valueType: 'string',
        defaultValue: 'all',
        description: 'Who can create new boards',
        isPublic: false,
        constraints: {enum: ['all', 'admin', 'none']},
    },
    {
        id: 'permissions.who_can_comment',
        category: 'permissions',
        key: 'who_can_comment',
        value: 'members',
        valueType: 'string',
        defaultValue: 'members',
        description: 'Who can comment on cards',
        isPublic: false,
        constraints: {enum: ['all', 'members', 'admin']},
    },
    {
        id: 'permissions.file_uploads_enabled',
        category: 'permissions',
        key: 'file_uploads_enabled',
        value: true,
        valueType: 'boolean',
        defaultValue: true,
        description: 'Enable file uploads',
        isPublic: false,
        constraints: {},
    },

    // Files settings
    {
        id: 'files.max_file_size',
        category: 'files',
        key: 'max_file_size',
        value: 10485760,
        valueType: 'number',
        defaultValue: 10485760,
        description: 'Maximum file size in bytes (default: 10MB)',
        isPublic: false,
        constraints: {min: 1048576, max: 104857600}, // 1MB to 100MB
    },
    {
        id: 'files.allowed_file_types',
        category: 'files',
        key: 'allowed_file_types',
        value: ['image/*', 'application/pdf', 'text/*'],
        valueType: 'json',
        defaultValue: ['image/*', 'application/pdf', 'text/*'],
        description: 'Allowed MIME types for file uploads',
        isPublic: false,
        constraints: {},
    },
    {
        id: 'files.storage_driver',
        category: 'files',
        key: 'storage_driver',
        value: 'local',
        valueType: 'string',
        defaultValue: 'local',
        description: 'File storage driver',
        isPublic: false,
        constraints: {enum: ['local', 's3']},
    },

    // System settings
    {
        id: 'system.app_name',
        category: 'system',
        key: 'app_name',
        value: 'Focalboard',
        valueType: 'string',
        defaultValue: 'Focalboard',
        description: 'Application name shown in UI',
        isPublic: true,
        constraints: {minLength: 1, maxLength: 50},
    },
    {
        id: 'system.maintenance_mode',
        category: 'system',
        key: 'maintenance_mode',
        value: false,
        valueType: 'boolean',
        defaultValue: false,
        description: 'Enable maintenance mode (disables non-admin access)',
        isPublic: true,
        constraints: {},
    },
    {
        id: 'system.telemetry_enabled',
        category: 'system',
        key: 'telemetry_enabled',
        value: false,
        valueType: 'boolean',
        defaultValue: false,
        description: 'Enable anonymous usage telemetry',
        isPublic: false,
        constraints: {},
    },
    {
        id: 'system.audit_log_retention_days',
        category: 'system',
        key: 'audit_log_retention_days',
        value: 90,
        valueType: 'number',
        defaultValue: 90,
        description: 'Days to retain audit logs',
        isPublic: false,
        constraints: {min: 1, max: 3650}, // 1 day to 10 years
    },
]

for (const setting of defaultSettings) {
    const existing = forceReload
        ? null
        : db.select().from(adminSettings).where(eq(adminSettings.id, setting.id)).get()

    if (!existing) {
        db.insert(adminSettings).values({
            id: setting.id,
            category: setting.category,
            key: setting.key,
            value: JSON.stringify(setting.value),
            valueType: setting.valueType,
            defaultValue: JSON.stringify(setting.defaultValue),
            description: setting.description,
            isPublic: setting.isPublic,
            constraints: JSON.stringify(setting.constraints),
            modifiedBy: null,
            createAt: now,
            updateAt: now,
        }).run()
        settingsCreated++
    }
}
console.log(`✅ Admin settings: ${settingsCreated} created\n`)

// ==================== SEED USER PREFERENCES ====================
console.log('📝 Seeding user preferences...')
let preferencesCreated = 0
for (const userSeed of usersData) {
    const existing = forceReload
        ? null
        : db
              .select()
              .from(preferences)
              .where(eq(preferences.userId, userSeed.id))
              .where(eq(preferences.category, 'onboarding'))
              .where(eq(preferences.name, 'welcomePageViewed'))
              .get()

    if (!existing) {
        db.insert(preferences)
            .values({
                userId: userSeed.id,
                category: 'onboarding',
                name: 'welcomePageViewed',
                value: '1', // Mark as viewed so users skip welcome page
            })
            .run()
        preferencesCreated++
    }
}
console.log(`✅ Preferences: ${preferencesCreated} created\n`)

// ==================== SUMMARY ====================
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`🎉 SEED COMPLETE!${forceReload ? ' (FORCE RELOAD)' : ''}`)
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')
console.log('📊 Summary:')
console.log(`   • Teams: ${teamsCreated} created${teamsSkipped > 0 ? `, ${teamsSkipped} skipped` : ''}`)
console.log(`   • Users: ${usersCreated} created${usersSkipped > 0 ? `, ${usersSkipped} skipped` : ''}`)
console.log(`   • Boards: ${boardsCreated} created${boardsSkipped > 0 ? `, ${boardsSkipped} skipped` : ''}`)
console.log(`   • Board Members: ${membersCreated} created`)
console.log(`   • Views: ${viewsCreated} created`)
console.log(`   • Cards: ${cardsCreated} created`)
console.log(`   • Checklist items: ${checklistItemsCreated} created`)
console.log(`   • Dependencies: ${dependenciesCreated / 2} created`)
console.log(`   • Categories: ${categoriesCreated} created`)
console.log(`   • Subscriptions: ${subscriptionsCreated} created`)
console.log(`   • Admin settings: ${settingsCreated} created`)
console.log(`   • Preferences: ${preferencesCreated} created`)
console.log('')
console.log('🚀 Next steps:')
console.log('   1. Run: bun dev')
console.log('   2. Log in with any of these accounts:')
console.log('')
usersData.slice(0, 3).forEach((u) => {
    console.log(`      • ${u.email} / ${u.password} (${u.roles})`)
})
console.log('')
console.log('   3. Explore the software-themed boards:')
boardsData.forEach((b) => {
    console.log(`      ${b.icon} ${b.title}`)
})
console.log('')

// Verify password compatibility (only if users were created)
if (usersCreated > 0) {
    console.log('🔐 Verifying password compatibility...')
    const testUser = usersData[0]
    const dbUser = db.select().from(user).where(eq(user.id, testUser.id)).get()
    const dbAccount = dbUser
        ? db.select().from(account).where(eq(account.userId, dbUser.id)).get()
        : null

    if (dbAccount?.password) {
        const isValid = await verifyPassword({
            hash: dbAccount.password,
            password: testUser.password,
        })
        if (isValid) {
            console.log('✅ Password verification successful - users can log in!')
        } else {
            console.error('❌ WARNING: Password verification failed!')
            console.error('   Users may not be able to log in with the seeded passwords.')
        }
    }
    console.log('')
}

if (!forceReload) {
    console.log('💡 Tip: Use --force flag to clear all data and reseed from scratch')
    console.log('   Example: bun src/backend/db/seed.ts --force')
    console.log('')
}
}

// Run seed when executed directly
if (import.meta.main) {
    const forceReload = process.argv.includes('--force')
    await seedDatabase(forceReload)
}
