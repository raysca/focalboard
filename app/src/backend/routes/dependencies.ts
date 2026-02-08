import { Hono } from 'hono'
import { DependencyService } from '../services/dependency.service'
import type {
    CreateDependencyRequest,
    BatchDependencyOperation
} from '../types/dependencies'

const app = new Hono()
const dependencyService = new DependencyService()

/**
 * Create a new dependency
 * POST /api/v2/cards/:cardId/dependencies
 */
app.post('/cards/:cardId/dependencies', async (c) => {
    try {
        const cardId = c.req.param('cardId')
        // TODO: Get user from auth middleware
        const userId = 'temp_user' // c.get('user')?.id

        const body = await c.req.json<CreateDependencyRequest>()

        // Validate request body
        if (!body.sourceCardId || !body.targetCardId || !body.dependencyType) {
            return c.json({ error: 'Missing required fields' }, 400)
        }

        const dependency = await dependencyService.createDependency(
            body.sourceCardId,
            body.targetCardId,
            body.dependencyType,
            userId,
            body.metadata
        )

        // TODO: Broadcast WebSocket event
        // await c.get('wsService')?.broadcast({
        //     type: 'dependency_created',
        //     dependency,
        //     boardId: dependency.boardId
        // })

        return c.json(dependency, 201)
    } catch (error) {
        console.error('Error creating dependency:', error)

        if (error instanceof Error) {
            if (error.message.includes('circular') || error.message.includes('cycle')) {
                return c.json({ error: error.message }, 400)
            }
            if (error.message.includes('not found')) {
                return c.json({ error: error.message }, 404)
            }
            if (error.message.includes('already exists')) {
                return c.json({ error: error.message }, 409)
            }
            return c.json({ error: error.message }, 500)
        }

        return c.json({ error: 'Failed to create dependency' }, 500)
    }
})

/**
 * Get dependencies for a card
 * GET /api/v2/cards/:cardId/dependencies?type={type}
 */
app.get('/cards/:cardId/dependencies', async (c) => {
    try {
        const cardId = c.req.param('cardId')
        const type = c.req.query('type') as any

        const dependencies = await dependencyService.getDependenciesForCard(cardId, type)

        return c.json(dependencies)
    } catch (error) {
        console.error('Error fetching dependencies:', error)
        return c.json({ error: 'Failed to fetch dependencies' }, 500)
    }
})

/**
 * Validate a dependency without creating it
 * POST /api/v2/cards/:cardId/dependencies/validate
 */
app.post('/cards/:cardId/dependencies/validate', async (c) => {
    try {
        const body = await c.req.json<CreateDependencyRequest>()

        if (!body.sourceCardId || !body.targetCardId || !body.dependencyType) {
            return c.json({ error: 'Missing required fields' }, 400)
        }

        const result = await dependencyService.validateDependency(
            body.sourceCardId,
            body.targetCardId,
            body.dependencyType
        )

        return c.json(result)
    } catch (error) {
        console.error('Error validating dependency:', error)
        return c.json({ error: 'Validation failed' }, 500)
    }
})

/**
 * Batch create/delete dependencies
 * POST /api/v2/cards/:cardId/dependencies/batch
 */
app.post('/cards/:cardId/dependencies/batch', async (c) => {
    try {
        const cardId = c.req.param('cardId')
        // TODO: Get user from auth middleware
        const userId = 'temp_user' // c.get('user')?.id

        const body = await c.req.json<BatchDependencyOperation>()

        const created = []
        const deleted = []
        const errors = []

        // Process deletions first
        if (body.delete && Array.isArray(body.delete)) {
            for (const depId of body.delete) {
                try {
                    await dependencyService.deleteDependency(depId)
                    deleted.push(depId)
                } catch (error) {
                    errors.push({
                        operation: 'delete',
                        id: depId,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    })
                }
            }
        }

        // Process creations
        if (body.create && Array.isArray(body.create)) {
            for (const req of body.create) {
                try {
                    const dep = await dependencyService.createDependency(
                        req.sourceCardId,
                        req.targetCardId,
                        req.dependencyType,
                        userId,
                        req.metadata
                    )
                    created.push(dep)
                } catch (error) {
                    errors.push({
                        operation: 'create',
                        request: req,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    })
                }
            }
        }

        return c.json({
            created,
            deleted,
            errors: errors.length > 0 ? errors : undefined
        })
    } catch (error) {
        console.error('Error in batch operation:', error)
        return c.json({ error: 'Batch operation failed' }, 500)
    }
})

/**
 * Get a specific dependency
 * GET /api/v2/dependencies/:depId
 */
app.get('/dependencies/:depId', async (c) => {
    try {
        const depId = c.req.param('depId')

        const dependency = await dependencyService.getDependency(depId)

        if (!dependency) {
            return c.json({ error: 'Dependency not found' }, 404)
        }

        return c.json(dependency)
    } catch (error) {
        console.error('Error fetching dependency:', error)
        return c.json({ error: 'Failed to fetch dependency' }, 500)
    }
})

/**
 * Delete a dependency
 * DELETE /api/v2/dependencies/:depId
 */
app.delete('/dependencies/:depId', async (c) => {
    try {
        const depId = c.req.param('depId')

        await dependencyService.deleteDependency(depId)

        // TODO: Broadcast WebSocket event
        // await c.get('wsService')?.broadcast({
        //     type: 'dependency_deleted',
        //     dependencyId: depId
        // })

        return c.json({ success: true })
    } catch (error) {
        console.error('Error deleting dependency:', error)

        if (error instanceof Error && error.message.includes('not found')) {
            return c.json({ error: error.message }, 404)
        }

        return c.json({ error: 'Failed to delete dependency' }, 500)
    }
})

/**
 * Get dependency graph for a board
 * GET /api/v2/boards/:boardId/dependencies/graph?includeRelated=true
 */
app.get('/boards/:boardId/dependencies/graph', async (c) => {
    try {
        const boardId = c.req.param('boardId')
        const includeRelated = c.req.query('includeRelated') === 'true'

        const graph = await dependencyService.getDependencyGraph(boardId, includeRelated)

        return c.json(graph)
    } catch (error) {
        console.error('Error fetching dependency graph:', error)
        return c.json({ error: 'Failed to fetch dependency graph' }, 500)
    }
})

export default app
