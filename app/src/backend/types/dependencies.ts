// Card Dependency Types
// Types for managing dependencies between cards

export type DependencyType =
    | 'blocks'
    | 'blocked_by'
    | 'related'
    | 'duplicate'
    | 'parent'
    | 'child'

export interface CardDependency {
    id: string
    sourceCardId: string
    targetCardId: string
    dependencyType: DependencyType
    createdBy: string
    createdAt: number
    updatedAt: number
    deletedAt: number
    boardId: string
    metadata?: CardDependencyMetadata
}

export interface CardDependencyMetadata {
    syncStatus?: boolean  // For duplicate cards
    enforceBlocking?: boolean  // For blocking dependencies
    notes?: string
    [key: string]: unknown
}

export interface CardSummary {
    id: string
    title: string
    boardId: string
    boardTitle?: string
    icon?: string
    isCompleted: boolean
}

export interface CardDependencyWithCards extends CardDependency {
    sourceCard?: CardSummary
    targetCard?: CardSummary
}

export interface CreateDependencyRequest {
    sourceCardId: string
    targetCardId: string
    dependencyType: DependencyType
    metadata?: CardDependencyMetadata
}

export interface BatchDependencyOperation {
    create?: CreateDependencyRequest[]
    delete?: string[]  // dependency IDs
}

export interface DependencyValidationResult {
    valid: boolean
    error?: string
    details?: {
        wouldCreateCycle: boolean
        cyclePath?: string[]
    }
}

export interface DependencyGraph {
    boardId: string
    nodes: DependencyGraphNode[]
    edges: DependencyGraphEdge[]
}

export interface DependencyGraphNode {
    id: string
    cardId: string
    title: string
    type: 'card'
    position?: {
        x: number
        y: number
    }
}

export interface DependencyGraphEdge {
    id: string
    source: string
    target: string
    dependencyType: DependencyType
    label?: string
}
