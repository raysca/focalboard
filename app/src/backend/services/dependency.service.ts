import { db } from '../db'
import { cardDependencies, blocks } from '../db/schema'
import { eq, and, inArray, sql } from 'drizzle-orm'
import type {
    CardDependency,
    CardDependencyMetadata,
    CardDependencyWithCards,
    CardSummary,
    DependencyType,
    DependencyValidationResult,
    DependencyGraph
} from '../types/dependencies'

export class DependencyService {
    /**
     * Generate a unique ID for a dependency
     */
    private generateId(): string {
        return `dep_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    }

    /**
     * Create a new dependency between cards
     */
    async createDependency(
        sourceCardId: string,
        targetCardId: string,
        dependencyType: DependencyType,
        createdBy: string,
        metadata?: CardDependencyMetadata
    ): Promise<CardDependency> {
        // Prevent self-references
        if (sourceCardId === targetCardId) {
            throw new Error('A card cannot depend on itself')
        }

        // Validate cards exist
        const [sourceCard, targetCard] = await Promise.all([
            this.getCard(sourceCardId),
            this.getCard(targetCardId)
        ])

        if (!sourceCard) {
            throw new Error('Source card not found')
        }
        if (!targetCard) {
            throw new Error('Target card not found')
        }

        // Check for circular dependencies in blocking chains
        if (dependencyType === 'blocks' || dependencyType === 'blocked_by') {
            const validation = await this.validateDependency(sourceCardId, targetCardId, dependencyType)
            if (!validation.valid) {
                throw new Error(validation.error || 'Invalid dependency')
            }
        }

        // Check if dependency already exists
        const existing = await this.findExistingDependency(sourceCardId, targetCardId, dependencyType)
        if (existing) {
            throw new Error('This dependency already exists')
        }

        // Create the dependency
        const now = Date.now()
        const dependency: CardDependency = {
            id: this.generateId(),
            sourceCardId,
            targetCardId,
            dependencyType,
            createdBy,
            createdAt: now,
            updatedAt: now,
            deletedAt: 0,
            boardId: sourceCard.boardId,
            metadata: metadata || {}
        }

        await db.insert(cardDependencies).values(dependency)

        // Create inverse dependency for bidirectional types
        if (this.isBidirectional(dependencyType)) {
            const inverseDep = this.createInverseDependency(dependency)
            await db.insert(cardDependencies).values(inverseDep)
        }

        return dependency
    }

    /**
     * Get all dependencies for a card
     */
    async getDependenciesForCard(
        cardId: string,
        type?: DependencyType
    ): Promise<CardDependencyWithCards[]> {
        const conditions = [
            eq(cardDependencies.deletedAt, 0),
            eq(cardDependencies.sourceCardId, cardId)
        ]

        if (type) {
            conditions.push(eq(cardDependencies.dependencyType, type))
        }

        const deps = await db
            .select()
            .from(cardDependencies)
            .where(and(...conditions))

        if (deps.length === 0) {
            return []
        }

        // Fetch related card details
        const cardIds = [...new Set(deps.flatMap(d => [d.sourceCardId, d.targetCardId]))]
        const cards = await this.getCardsByIds(cardIds)
        const cardMap = new Map(cards.map(c => [c.id, c]))

        return deps.map(dep => ({
            ...dep,
            sourceCard: this.toCardSummary(cardMap.get(dep.sourceCardId)),
            targetCard: this.toCardSummary(cardMap.get(dep.targetCardId))
        }))
    }

    /**
     * Get a specific dependency by ID
     */
    async getDependency(dependencyId: string): Promise<CardDependencyWithCards | null> {
        const result = await db
            .select()
            .from(cardDependencies)
            .where(
                and(
                    eq(cardDependencies.id, dependencyId),
                    eq(cardDependencies.deletedAt, 0)
                )
            )
            .limit(1)

        if (result.length === 0) {
            return null
        }

        const dep = result[0]
        const cards = await this.getCardsByIds([dep.sourceCardId, dep.targetCardId])
        const cardMap = new Map(cards.map(c => [c.id, c]))

        return {
            ...dep,
            sourceCard: this.toCardSummary(cardMap.get(dep.sourceCardId)),
            targetCard: this.toCardSummary(cardMap.get(dep.targetCardId))
        }
    }

    /**
     * Delete a dependency (soft delete)
     */
    async deleteDependency(dependencyId: string): Promise<void> {
        const dep = await db
            .select()
            .from(cardDependencies)
            .where(
                and(
                    eq(cardDependencies.id, dependencyId),
                    eq(cardDependencies.deletedAt, 0)
                )
            )
            .limit(1)

        if (dep.length === 0) {
            throw new Error('Dependency not found')
        }

        const now = Date.now()
        await db
            .update(cardDependencies)
            .set({ deletedAt: now, updatedAt: now })
            .where(eq(cardDependencies.id, dependencyId))

        // Also delete inverse if bidirectional
        if (this.isBidirectional(dep[0].dependencyType)) {
            const inverseType = this.getInverseType(dep[0].dependencyType)
            await db
                .update(cardDependencies)
                .set({ deletedAt: now, updatedAt: now })
                .where(
                    and(
                        eq(cardDependencies.sourceCardId, dep[0].targetCardId),
                        eq(cardDependencies.targetCardId, dep[0].sourceCardId),
                        eq(cardDependencies.dependencyType, inverseType),
                        eq(cardDependencies.deletedAt, 0)
                    )
                )
        }
    }

    /**
     * Validate a dependency without creating it
     */
    async validateDependency(
        sourceCardId: string,
        targetCardId: string,
        dependencyType: DependencyType
    ): Promise<DependencyValidationResult> {
        // Self-reference check
        if (sourceCardId === targetCardId) {
            return {
                valid: false,
                error: 'A card cannot depend on itself'
            }
        }

        // Only check for cycles in blocking dependencies
        if (dependencyType !== 'blocks' && dependencyType !== 'blocked_by') {
            return { valid: true }
        }

        // Build the dependency graph and check for cycles
        const wouldCreateCycle = await this.wouldCreateCycle(sourceCardId, targetCardId, dependencyType)

        if (wouldCreateCycle) {
            return {
                valid: false,
                error: 'This dependency would create a circular dependency chain',
                details: {
                    wouldCreateCycle: true
                }
            }
        }

        return { valid: true }
    }

    /**
     * Get dependency graph for a board
     */
    async getDependencyGraph(boardId: string, includeRelated = false): Promise<DependencyGraph> {
        // Get all cards in the board
        const cards = await db
            .select()
            .from(blocks)
            .where(
                and(
                    eq(blocks.boardId, boardId),
                    eq(blocks.type, 'card'),
                    eq(blocks.deleteAt, 0)
                )
            )

        const cardIds = cards.map(c => c.id)

        if (cardIds.length === 0) {
            return {
                boardId,
                nodes: [],
                edges: []
            }
        }

        // Get all dependencies
        const typeConditions = includeRelated
            ? undefined
            : inArray(cardDependencies.dependencyType, ['blocks', 'blocked_by'])

        const deps = await db
            .select()
            .from(cardDependencies)
            .where(
                and(
                    inArray(cardDependencies.sourceCardId, cardIds),
                    eq(cardDependencies.deletedAt, 0),
                    typeConditions
                )
            )

        // Build nodes
        const nodes = cards.map(card => ({
            id: card.id,
            cardId: card.id,
            title: card.title,
            type: 'card' as const
        }))

        // Build edges
        const edges = deps.map(dep => ({
            id: dep.id,
            source: dep.sourceCardId,
            target: dep.targetCardId,
            dependencyType: dep.dependencyType as DependencyType,
            label: this.getDependencyLabel(dep.dependencyType as DependencyType)
        }))

        return {
            boardId,
            nodes,
            edges
        }
    }

    /**
     * Check if creating a dependency would create a cycle
     */
    private async wouldCreateCycle(
        sourceCardId: string,
        targetCardId: string,
        dependencyType: DependencyType
    ): Promise<boolean> {
        // Build the dependency graph
        const graph = await this.buildBlockingGraph()

        // Check if adding edge from source to target creates a cycle
        // by checking if there's already a path from target to source
        return this.hasPath(graph, targetCardId, sourceCardId)
    }

    /**
     * Build adjacency list of blocking dependencies
     */
    private async buildBlockingGraph(): Promise<Map<string, string[]>> {
        const deps = await db
            .select()
            .from(cardDependencies)
            .where(
                and(
                    eq(cardDependencies.deletedAt, 0),
                    eq(cardDependencies.dependencyType, 'blocks')
                )
            )

        const graph = new Map<string, string[]>()

        for (const dep of deps) {
            if (!graph.has(dep.sourceCardId)) {
                graph.set(dep.sourceCardId, [])
            }
            graph.get(dep.sourceCardId)!.push(dep.targetCardId)
        }

        return graph
    }

    /**
     * Check if there's a path from source to target using DFS
     */
    private hasPath(
        graph: Map<string, string[]>,
        source: string,
        target: string
    ): boolean {
        const visited = new Set<string>()
        const stack = [source]

        while (stack.length > 0) {
            const current = stack.pop()!

            if (current === target) {
                return true
            }

            if (visited.has(current)) {
                continue
            }

            visited.add(current)
            const neighbors = graph.get(current) || []
            stack.push(...neighbors)
        }

        return false
    }

    /**
     * Check if dependency already exists
     */
    private async findExistingDependency(
        sourceCardId: string,
        targetCardId: string,
        dependencyType: DependencyType
    ): Promise<CardDependency | null> {
        const result = await db
            .select()
            .from(cardDependencies)
            .where(
                and(
                    eq(cardDependencies.sourceCardId, sourceCardId),
                    eq(cardDependencies.targetCardId, targetCardId),
                    eq(cardDependencies.dependencyType, dependencyType),
                    eq(cardDependencies.deletedAt, 0)
                )
            )
            .limit(1)

        return result.length > 0 ? result[0] as CardDependency : null
    }

    /**
     * Check if dependency type requires bidirectional creation
     */
    private isBidirectional(type: DependencyType): boolean {
        return ['blocks', 'related', 'duplicate', 'parent'].includes(type)
    }

    /**
     * Get the inverse dependency type
     */
    private getInverseType(type: DependencyType): DependencyType {
        const inverseMap: Record<string, DependencyType> = {
            blocks: 'blocked_by',
            blocked_by: 'blocks',
            related: 'related',
            duplicate: 'duplicate',
            parent: 'child',
            child: 'parent'
        }
        return inverseMap[type]
    }

    /**
     * Create inverse dependency
     */
    private createInverseDependency(dep: CardDependency): CardDependency {
        return {
            id: this.generateId(),
            sourceCardId: dep.targetCardId,
            targetCardId: dep.sourceCardId,
            dependencyType: this.getInverseType(dep.dependencyType),
            createdBy: dep.createdBy,
            createdAt: dep.createdAt,
            updatedAt: dep.updatedAt,
            deletedAt: 0,
            boardId: dep.boardId,
            metadata: dep.metadata
        }
    }

    /**
     * Get card by ID
     */
    private async getCard(cardId: string) {
        const result = await db
            .select()
            .from(blocks)
            .where(
                and(
                    eq(blocks.id, cardId),
                    eq(blocks.type, 'card'),
                    eq(blocks.deleteAt, 0)
                )
            )
            .limit(1)

        return result[0] || null
    }

    /**
     * Get multiple cards by IDs
     */
    private async getCardsByIds(cardIds: string[]) {
        if (cardIds.length === 0) return []

        return db
            .select()
            .from(blocks)
            .where(
                and(
                    inArray(blocks.id, cardIds),
                    eq(blocks.type, 'card'),
                    eq(blocks.deleteAt, 0)
                )
            )
    }

    /**
     * Convert card to summary
     */
    private toCardSummary(card: any): CardSummary | undefined {
        if (!card) return undefined

        const fields = typeof card.fields === 'string' ? JSON.parse(card.fields) : card.fields
        const properties = fields?.properties || {}

        return {
            id: card.id,
            title: card.title || 'Untitled',
            boardId: card.boardId,
            icon: fields?.icon || '',
            isCompleted: properties?.status === 'completed' || properties?.status === 'done'
        }
    }

    /**
     * Get label for dependency type
     */
    private getDependencyLabel(type: DependencyType): string {
        const labels: Record<DependencyType, string> = {
            blocks: 'Blocks',
            blocked_by: 'Blocked by',
            related: 'Related',
            duplicate: 'Duplicate',
            parent: 'Parent',
            child: 'Child'
        }
        return labels[type]
    }
}
