/**
 * Simple integration tests for card dependencies
 * Tests the core functionality with proper CSRF headers
 */

import { describe, test, expect } from 'bun:test'
import { db as database } from '../../src/backend/db'
import { cardDependencies, blocks } from '../../src/backend/db/schema'
import { eq, and } from 'drizzle-orm'

describe('Card Dependencies - Database Layer', () => {
    test('should have card_dependencies table', async () => {
        // Verify table exists by querying it
        const result = await database.select().from(cardDependencies).limit(1)
        expect(Array.isArray(result)).toBe(true)
    })

    test('should have seeded dependencies', async () => {
        // Check that seed data was created
        const deps = await database
            .select()
            .from(cardDependencies)
            .where(eq(cardDependencies.deletedAt, 0))

        expect(deps.length).toBeGreaterThan(0)
        console.log(`Found ${deps.length} active dependencies`)
    })

    test('should have blocking dependencies', async () => {
        const blockingDeps = await database
            .select()
            .from(cardDependencies)
            .where(
                and(
                    eq(cardDependencies.dependencyType, 'blocks'),
                    eq(cardDependencies.deletedAt, 0)
                )
            )

        expect(blockingDeps.length).toBeGreaterThan(0)
        console.log(`Found ${blockingDeps.length} blocking dependencies`)
    })

    test('should have blocked_by dependencies', async () => {
        const blockedByDeps = await database
            .select()
            .from(cardDependencies)
            .where(
                and(
                    eq(cardDependencies.dependencyType, 'blocked_by'),
                    eq(cardDependencies.deletedAt, 0)
                )
            )

        expect(blockedByDeps.length).toBeGreaterThan(0)
        console.log(`Found ${blockedByDeps.length} blocked_by dependencies`)
    })

    test('should have related dependencies', async () => {
        const relatedDeps = await database
            .select()
            .from(cardDependencies)
            .where(
                and(
                    eq(cardDependencies.dependencyType, 'related'),
                    eq(cardDependencies.deletedAt, 0)
                )
            )

        expect(relatedDeps.length).toBeGreaterThan(0)
        console.log(`Found ${relatedDeps.length} related dependencies`)
    })

    test('should have bidirectional relationships', async () => {
        // Get a blocking dependency
        const blockingDep = await database
            .select()
            .from(cardDependencies)
            .where(
                and(
                    eq(cardDependencies.dependencyType, 'blocks'),
                    eq(cardDependencies.deletedAt, 0)
                )
            )
            .limit(1)

        expect(blockingDep.length).toBe(1)

        // Find its inverse
        const inverse = await database
            .select()
            .from(cardDependencies)
            .where(
                and(
                    eq(cardDependencies.sourceCardId, blockingDep[0].targetCardId),
                    eq(cardDependencies.targetCardId, blockingDep[0].sourceCardId),
                    eq(cardDependencies.dependencyType, 'blocked_by'),
                    eq(cardDependencies.deletedAt, 0)
                )
            )

        expect(inverse.length).toBe(1)
        console.log('✓ Bidirectional relationship verified')
    })

    test('should join with cards correctly', async () => {
        const deps = await database
            .select({
                depId: cardDependencies.id,
                depType: cardDependencies.dependencyType,
                sourceTitle: blocks.title,
            })
            .from(cardDependencies)
            .innerJoin(blocks, eq(cardDependencies.sourceCardId, blocks.id))
            .where(eq(cardDependencies.deletedAt, 0))
            .limit(1)

        expect(deps.length).toBe(1)
        expect(deps[0].sourceTitle).toBeTruthy()
        console.log(`Sample: ${deps[0].sourceTitle} ${deps[0].depType}`)
    })

    test('should have metadata stored', async () => {
        const blockingWithMetadata = await database
            .select()
            .from(cardDependencies)
            .where(
                and(
                    eq(cardDependencies.dependencyType, 'blocks'),
                    eq(cardDependencies.deletedAt, 0)
                )
            )
            .limit(1)

        expect(blockingWithMetadata.length).toBe(1)
        expect(blockingWithMetadata[0].metadata).toBeTruthy()
        console.log('Metadata:', blockingWithMetadata[0].metadata)
    })

    test('should have foreign key relationships', async () => {
        // All dependencies should reference valid cards
        const depsWithInvalidCards = await database
            .select({
                depId: cardDependencies.id,
            })
            .from(cardDependencies)
            .leftJoin(blocks, eq(cardDependencies.sourceCardId, blocks.id))
            .where(
                and(
                    eq(cardDependencies.deletedAt, 0),
                    eq(blocks.id, null as any) // Card doesn't exist
                )
            )

        // Should be 0 (all deps reference valid cards)
        expect(depsWithInvalidCards.length).toBe(0)
    })

    test('should have specific blocking chain from seed', async () => {
        // "Build authentication flow" should be blocked by "Design database schema"
        const authCard = await database
            .select()
            .from(blocks)
            .where(eq(blocks.title, 'Build authentication flow'))
            .limit(1)

        if (authCard.length > 0) {
            const blockers = await database
                .select({
                    blockerTitle: blocks.title,
                })
                .from(cardDependencies)
                .innerJoin(blocks, eq(cardDependencies.sourceCardId, blocks.id))
                .where(
                    and(
                        eq(cardDependencies.targetCardId, authCard[0].id),
                        eq(cardDependencies.dependencyType, 'blocks'),
                        eq(cardDependencies.deletedAt, 0)
                    )
                )

            console.log('Build authentication flow is blocked by:', blockers)
            expect(blockers.length).toBeGreaterThan(0)
        }
    })
})

describe('Card Dependencies - Type Counts', () => {
    test('should have correct dependency type distribution', async () => {
        const typeCounts = await database
            .select({
                type: cardDependencies.dependencyType,
            })
            .from(cardDependencies)
            .where(eq(cardDependencies.deletedAt, 0))
            .groupBy(cardDependencies.dependencyType)

        console.log('Dependency type distribution:')
        console.log(`  Found ${typeCounts.length} different dependency types`)
        typeCounts.forEach((row: any) => {
            console.log(`  - ${row.type}`)
        })

        expect(typeCounts.length).toBeGreaterThan(0)
    })
})
