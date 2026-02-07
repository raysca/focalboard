import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import {boardsApi} from '../api/boards'
import type {Board} from '../api/types'

export function useBoardsQuery(teamId: string) {
    return useQuery({
        queryKey: ['boards', teamId],
        queryFn: () => boardsApi.getBoards(teamId),
        enabled: !!teamId,
    })
}

export function useBoardQuery(boardId: string) {
    return useQuery({
        queryKey: ['board', boardId],
        queryFn: () => boardsApi.getBoard(boardId),
        enabled: !!boardId,
    })
}

export function useCreateBoardMutation(teamId: string) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (board: Partial<Board>) => boardsApi.createBoard({...board, teamId}),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['boards', teamId]})
        },
    })
}

export function usePatchBoardMutation() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({boardId, patch}: {boardId: string; patch: Partial<Board>}) =>
            boardsApi.patchBoard(boardId, patch),
        onSuccess: (data) => {
            queryClient.invalidateQueries({queryKey: ['board', data.id]})
            queryClient.invalidateQueries({queryKey: ['boards']})
        },
    })
}

export function useDeleteBoardMutation(teamId: string) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (boardId: string) => boardsApi.deleteBoard(boardId),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['boards', teamId]})
        },
    })
}
