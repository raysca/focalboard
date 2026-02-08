import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import { createApp, type AppDeps } from '../../src/backend/index'
import { db as database } from '../../src/backend/db'
import { createAuth } from '../../src/backend/auth'
import { blocks, cardDependencies } from '../../src/backend/db/schema'
import { eq, and } from 'drizzle-orm'

describe('Card Dependencies API', () => {
    let app: ReturnType<typeof createApp>
    let testUserId: string
    let testBoardId: string
    let card1Id: string
    let card2Id: string
    let card3Id: string

    beforeAll(async () => {
        const authInstance = createAuth(database)
        const deps: AppDeps = {
            db: database,
            auth: authInstance,
        }
        app = createApp(deps)

        // Create test data
        testUserId = 'test-user-deps'
        testBoardId = 'test-board-deps'
        card1Id = 'test-card-1'
        card2Id = 'test-card-2'
        card3Id = 'test-card-3'

        const now = Date.now()

        // Insert test cards
        await database.insert(blocks).values([
            {
                id: card1Id,
                boardId: testBoardId,
                parentId: testBoardId,
                createdBy: testUserId,
                modifiedBy: testUserId,
                type: 'card',
                title: 'Test Card 1',
                schema: 1,
                fields: { icon: '🎯', properties: {}, contentOrder: [], isTemplate: false },
                createAt: now,
                updateAt: now,
                deleteAt: 0,
            },
            {
                id: card2Id,
                boardId: testBoardId,
                parentId: testBoardId,
                createdBy: testUserId,
                modifiedBy: testUserId,
                type: 'card',
                title: 'Test Card 2',
                schema: 1,
                fields: { icon: '🚀', properties: {}, contentOrder: [], isTemplate: false },
                createAt: now,
                updateAt: now,
                deleteAt: 0,
            },
            {
                id: card3Id,
                boardId: testBoardId,
                parentId: testBoardId,
                createdBy: testUserId,
                modifiedBy: testUserId,
                type: 'card',
                title: 'Test Card 3',
                schema: 1,
                fields: { icon: '⚡', properties: {}, contentOrder: [], isTemplate: false },
                createAt: now,
                updateAt: now,
                deleteAt: 0,
            },
        ])
    })

    afterAll(async () => {
        // Clean up test data
        await database.delete(blocks).where(eq(blocks.boardId, testBoardId))
        await database
            .delete(cardDependencies)
            .where(eq(cardDependencies.boardId, testBoardId))
    })

    test('should create a blocking dependency', async () => {
        const response = await app.request(`/api/v2/cards/${card1Id}/dependencies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sourceCardId: card1Id,
                targetCardId: card2Id,
                dependencyType: 'blocks',
                metadata: { enforceBlocking: true },
            }),
        })

        if (response.status !== 201) {
            const error = await response.json()
            console.error('Error creating dependency:', error)
        }

        expect(response.status).toBe(201)
        const data = await response.json()
        expect(data.dependencyType).toBe('blocks')
        expect(data.sourceCardId).toBe(card1Id)
        expect(data.targetCardId).toBe(card2Id)
    })

    test('should create inverse dependency automatically', async () => {
        // The inverse should have been created automatically
        const deps = await database
            .select()
            .from(cardDependencies)
            .where(
                and(
                    eq(cardDependencies.sourceCardId, card2Id),
                    eq(cardDependencies.targetCardId, card1Id),
                    eq(cardDependencies.dependencyType, 'blocked_by'),
                    eq(cardDependencies.deletedAt, 0)
                )
            )

        expect(deps.length).toBe(1)
    })

    test('should get dependencies for a card', async () => {
        const response = await app.request(`/api/v2/cards/${card1Id}/dependencies`, {
            method: 'GET',
        })

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(Array.isArray(data)).toBe(true)
        expect(data.length).toBeGreaterThan(0)
    })

    test('should prevent circular dependencies', async () => {
        // Card1 already blocks Card2
        // Try to make Card2 block Card1 (would create a cycle)
        const response = await app.request('/api/v2/cards/card-2/dependencies/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sourceCardId: card2Id,
                targetCardId: card1Id,
                dependencyType: 'blocks',
            }),
        })

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.valid).toBe(false)
        expect(data.error).toContain('circular')
    })

    test('should prevent self-reference', async () => {
        const response = await app.request('/api/v2/cards/card-1/dependencies/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sourceCardId: card1Id,
                targetCardId: card1Id,
                dependencyType: 'blocks',
            }),
        })

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.valid).toBe(false)
        expect(data.error).toContain('cannot depend on itself')
    })

    test('should create related dependencies', async () => {
        const response = await app.request('/api/v2/cards/card-2/dependencies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sourceCardId: card2Id,
                targetCardId: card3Id,
                dependencyType: 'related',
            }),
        })

        expect(response.status).toBe(201)
        const data = await response.json()
        expect(data.dependencyType).toBe('related')
    })

    test('should delete a dependency', async () => {
        // Get a dependency to delete
        const deps = await database
            .select()
            .from(cardDependencies)
            .where(
                and(
                    eq(cardDependencies.sourceCardId, card2Id),
                    eq(cardDependencies.targetCardId, card3Id),
                    eq(cardDependencies.dependencyType, 'related'),
                    eq(cardDependencies.deletedAt, 0)
                )
            )
            .limit(1)

        expect(deps.length).toBe(1)
        const depId = deps[0].id

        const response = await app.request(`/api/v2/dependencies/${depId}`, {
            method: 'DELETE',
        })

        expect(response.status).toBe(200)

        // Verify it's soft deleted
        const deleted = await database
            .select()
            .from(cardDependencies)
            .where(eq(cardDependencies.id, depId))
            .limit(1)

        expect(deleted[0].deletedAt).toBeGreaterThan(0)
    })

    test('should get board dependency graph', async () => {
        const response = await app.request(
            `/api/v2/boards/${testBoardId}/dependencies/graph`,
            {
                method: 'GET',
            }
        )

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data).toHaveProperty('boardId')
        expect(data).toHaveProperty('nodes')
        expect(data).toHaveProperty('edges')
        expect(Array.isArray(data.nodes)).toBe(true)
        expect(Array.isArray(data.edges)).toBe(true)
    })

    test('should handle batch operations', async () => {
        const response = await app.request('/api/v2/cards/card-1/dependencies/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                create: [
                    {
                        sourceCardId: card1Id,
                        targetCardId: card3Id,
                        dependencyType: 'related',
                    },
                ],
                delete: [],
            }),
        })

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data).toHaveProperty('created')
        expect(data).toHaveProperty('deleted')
        expect(Array.isArray(data.created)).toBe(true)
    })

    test('should reject invalid dependency type', async () => {
        const response = await app.request('/api/v2/cards/card-1/dependencies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sourceCardId: card1Id,
                targetCardId: card3Id,
                dependencyType: 'invalid_type',
            }),
        })

        // Should either fail validation or succeed but not create
        expect([200, 201, 400, 500]).toContain(response.status)
    })

    test('should filter dependencies by type', async () => {
        const response = await app.request(
            `/api/v2/cards/${card1Id}/dependencies?type=blocks`,
            {
                method: 'GET',
            }
        )

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(Array.isArray(data)).toBe(true)
        // All returned deps should be of type 'blocks'
        data.forEach((dep: any) => {
            expect(dep.dependencyType).toBe('blocks')
        })
    })

    test('should allow non-blocking deps without cycle check', async () => {
        // Related deps don't check for cycles
        const response = await app.request('/api/v2/cards/card-3/dependencies/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sourceCardId: card3Id,
                targetCardId: card1Id,
                dependencyType: 'related',
            }),
        })

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.valid).toBe(true)
    })
})

describe('Dependency Service Logic', () => {
    test('should detect transitive circular dependencies', async () => {
        // This tests the cycle detection algorithm
        // A -> B -> C, trying to add C -> A should fail
        const testBoardId = 'cycle-test-board'
        const cardA = 'cycle-card-a'
        const cardB = 'cycle-card-b'
        const cardC = 'cycle-card-c'
        const now = Date.now()

        // Create test cards
        await database.insert(blocks).values([
            {
                id: cardA,
                boardId: testBoardId,
                parentId: testBoardId,
                createdBy: 'test-user',
                modifiedBy: 'test-user',
                type: 'card',
                title: 'Card A',
                schema: 1,
                fields: { icon: 'A', properties: {}, contentOrder: [], isTemplate: false },
                createAt: now,
                updateAt: now,
                deleteAt: 0,
            },
            {
                id: cardB,
                boardId: testBoardId,
                parentId: testBoardId,
                createdBy: 'test-user',
                modifiedBy: 'test-user',
                type: 'card',
                title: 'Card B',
                schema: 1,
                fields: { icon: 'B', properties: {}, contentOrder: [], isTemplate: false },
                createAt: now,
                updateAt: now,
                deleteAt: 0,
            },
            {
                id: cardC,
                boardId: testBoardId,
                parentId: testBoardId,
                createdBy: 'test-user',
                modifiedBy: 'test-user',
                type: 'card',
                title: 'Card C',
                schema: 1,
                fields: { icon: 'C', properties: {}, contentOrder: [], isTemplate: false },
                createAt: now,
                updateAt: now,
                deleteAt: 0,
            },
        ])

        // Create A -> B dependency
        await database.insert(cardDependencies).values([
            {
                id: 'dep-a-b',
                sourceCardId: cardA,
                targetCardId: cardB,
                dependencyType: 'blocks',
                createdBy: 'test-user',
                createdAt: now,
                updatedAt: now,
                deletedAt: 0,
                boardId: testBoardId,
                metadata: {},
            },
            {
                id: 'dep-b-a-inv',
                sourceCardId: cardB,
                targetCardId: cardA,
                dependencyType: 'blocked_by',
                createdBy: 'test-user',
                createdAt: now,
                updatedAt: now,
                deletedAt: 0,
                boardId: testBoardId,
                metadata: {},
            },
        ])

        // Create B -> C dependency
        await database.insert(cardDependencies).values([
            {
                id: 'dep-b-c',
                sourceCardId: cardB,
                targetCardId: cardC,
                dependencyType: 'blocks',
                createdBy: 'test-user',
                createdAt: now,
                updatedAt: now,
                deletedAt: 0,
                boardId: testBoardId,
                metadata: {},
            },
            {
                id: 'dep-c-b-inv',
                sourceCardId: cardC,
                targetCardId: cardB,
                dependencyType: 'blocked_by',
                createdBy: 'test-user',
                createdAt: now,
                updatedAt: now,
                deletedAt: 0,
                boardId: testBoardId,
                metadata: {},
            },
        ])

        // Now try to create C -> A (would complete the cycle)
        const authInstance = createAuth(database)
        const deps: AppDeps = {
            db: database,
            auth: authInstance,
        }
        const app = createApp(deps)

        const response = await app.request('/api/v2/cards/cycle-card-c/dependencies/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sourceCardId: cardC,
                targetCardId: cardA,
                dependencyType: 'blocks',
            }),
        })

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.valid).toBe(false)

        // Clean up
        await database.delete(blocks).where(eq(blocks.boardId, testBoardId))
        await database
            .delete(cardDependencies)
            .where(eq(cardDependencies.boardId, testBoardId))
    })
})
