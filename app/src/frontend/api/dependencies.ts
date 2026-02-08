import type {
    CardDependency,
    CardDependencyWithCards,
    CreateDependencyRequest,
    BatchDependencyOperation,
    DependencyValidationResult,
    DependencyGraph,
    DependencyType
} from '../../backend/types/dependencies'

const API_BASE = '/api/v2'

/**
 * Create a new dependency between cards
 */
export async function createDependency(
    cardId: string,
    request: CreateDependencyRequest
): Promise<CardDependency> {
    const response = await fetch(`${API_BASE}/cards/${cardId}/dependencies`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(request),
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create dependency')
    }

    return response.json()
}

/**
 * Get all dependencies for a card
 */
export async function getDependencies(
    cardId: string,
    type?: DependencyType
): Promise<CardDependencyWithCards[]> {
    const params = type ? `?type=${type}` : ''
    const response = await fetch(`${API_BASE}/cards/${cardId}/dependencies${params}`, {
        credentials: 'include',
    })

    if (!response.ok) {
        throw new Error('Failed to fetch dependencies')
    }

    return response.json()
}

/**
 * Get a specific dependency by ID
 */
export async function getDependency(
    dependencyId: string
): Promise<CardDependencyWithCards> {
    const response = await fetch(`${API_BASE}/dependencies/${dependencyId}`, {
        credentials: 'include',
    })

    if (!response.ok) {
        throw new Error('Failed to fetch dependency')
    }

    return response.json()
}

/**
 * Delete a dependency
 */
export async function deleteDependency(depId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/dependencies/${depId}`, {
        method: 'DELETE',
        credentials: 'include',
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete dependency')
    }
}

/**
 * Validate a dependency without creating it
 */
export async function validateDependency(
    request: CreateDependencyRequest
): Promise<DependencyValidationResult> {
    const response = await fetch(
        `${API_BASE}/cards/${request.sourceCardId}/dependencies/validate`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(request),
        }
    )

    if (!response.ok) {
        throw new Error('Validation failed')
    }

    return response.json()
}

/**
 * Batch create/delete dependencies
 */
export async function batchDependencies(
    cardId: string,
    operations: BatchDependencyOperation
): Promise<{
    created: CardDependency[]
    deleted: string[]
    errors?: Array<{ operation: string; error: string }>
}> {
    const response = await fetch(`${API_BASE}/cards/${cardId}/dependencies/batch`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(operations),
    })

    if (!response.ok) {
        throw new Error('Batch operation failed')
    }

    return response.json()
}

/**
 * Get dependency graph for a board
 */
export async function getBoardDependencyGraph(
    boardId: string,
    includeRelated = false
): Promise<DependencyGraph> {
    const params = includeRelated ? '?includeRelated=true' : ''
    const response = await fetch(
        `${API_BASE}/boards/${boardId}/dependencies/graph${params}`,
        {
            credentials: 'include',
        }
    )

    if (!response.ok) {
        throw new Error('Failed to fetch dependency graph')
    }

    return response.json()
}
