import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import {blocksApi} from '../api/blocks'
import type {Block, BoardView, Card} from '../api/types'

export function useBlocksQuery(boardId: string) {
    return useQuery({
        queryKey: ['blocks', boardId],
        queryFn: () => blocksApi.getBlocks(boardId),
        enabled: !!boardId,
    })
}

export function useBoardDataQuery(boardId: string) {
    return useQuery({
        queryKey: ['blocks', boardId],
        queryFn: () => blocksApi.getBlocks(boardId),
        enabled: !!boardId,
        select: (blocks: Block[]) => {
            const views = blocks.filter((b): b is BoardView => b.type === 'view')
            const cards = blocks.filter((b): b is Card => b.type === 'card')
            const contents = blocks.filter((b) => b.type !== 'view' && b.type !== 'card')
            return {views, cards, contents, allBlocks: blocks}
        },
    })
}

export function useInsertBlocksMutation(boardId: string) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (blocks: Partial<Block>[]) => blocksApi.insertBlocks(boardId, blocks),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['blocks', boardId]})
        },
    })
}

export function usePatchBlockMutation(boardId: string) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({blockId, patch}: {blockId: string; patch: Partial<Block>}) =>
            blocksApi.patchBlock(boardId, blockId, patch),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['blocks', boardId]})
        },
    })
}

export function useDeleteBlockMutation(boardId: string) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (blockId: string) => blocksApi.deleteBlock(boardId, blockId),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['blocks', boardId]})
        },
    })
}
