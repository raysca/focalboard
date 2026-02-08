import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/dependencies'
import type {
    CreateDependencyRequest,
    DependencyType,
    BatchDependencyOperation
} from '../../backend/types/dependencies'

/**
 * Hook to fetch all dependencies for a card
 */
export function useDependencies(cardId: string, type?: DependencyType) {
    return useQuery({
        queryKey: ['dependencies', cardId, type],
        queryFn: () => api.getDependencies(cardId, type),
        staleTime: 30000, // 30 seconds
        enabled: !!cardId,
    })
}

/**
 * Hook to fetch a specific dependency
 */
export function useDependency(dependencyId: string) {
    return useQuery({
        queryKey: ['dependency', dependencyId],
        queryFn: () => api.getDependency(dependencyId),
        enabled: !!dependencyId,
    })
}

/**
 * Hook to create a new dependency
 */
export function useCreateDependency(cardId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (request: CreateDependencyRequest) =>
            api.createDependency(cardId, request),
        onSuccess: (data) => {
            // Invalidate queries for both source and target cards
            queryClient.invalidateQueries({ queryKey: ['dependencies', cardId] })
            queryClient.invalidateQueries({
                queryKey: ['dependencies', data.targetCardId],
            })
            queryClient.invalidateQueries({ queryKey: ['card', cardId] })
            queryClient.invalidateQueries({ queryKey: ['card', data.targetCardId] })

            // Invalidate board dependency graph
            queryClient.invalidateQueries({
                queryKey: ['dependency-graph', data.boardId],
            })
        },
    })
}

/**
 * Hook to delete a dependency
 */
export function useDeleteDependency() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (depId: string) => api.deleteDependency(depId),
        onSuccess: () => {
            // Invalidate all dependency queries
            queryClient.invalidateQueries({ queryKey: ['dependencies'] })
            queryClient.invalidateQueries({ queryKey: ['dependency-graph'] })
        },
    })
}

/**
 * Hook to validate a dependency
 */
export function useValidateDependency() {
    return useMutation({
        mutationFn: (request: CreateDependencyRequest) => api.validateDependency(request),
    })
}

/**
 * Hook to perform batch dependency operations
 */
export function useBatchDependencies(cardId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (operations: BatchDependencyOperation) =>
            api.batchDependencies(cardId, operations),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dependencies', cardId] })
            queryClient.invalidateQueries({ queryKey: ['card', cardId] })
        },
    })
}

/**
 * Hook to fetch dependency graph for a board
 */
export function useDependencyGraph(boardId: string, includeRelated = false) {
    return useQuery({
        queryKey: ['dependency-graph', boardId, includeRelated],
        queryFn: () => api.getBoardDependencyGraph(boardId, includeRelated),
        staleTime: 60000, // 1 minute
        enabled: !!boardId,
    })
}
