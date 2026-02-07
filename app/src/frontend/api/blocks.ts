import {api} from './client'
import type {Block} from './types'

export const blocksApi = {
    getBlocks: (boardId: string, params?: {type?: string}) => {
        const qs = params?.type ? `?type=${params.type}` : ''
        return api.get<Block[]>(`/boards/${boardId}/blocks${qs}`)
    },

    insertBlocks: (boardId: string, blocks: Partial<Block>[]) =>
        api.post<Block[]>(`/boards/${boardId}/blocks`, blocks),

    patchBlock: (boardId: string, blockId: string, patch: Partial<Block>) =>
        api.patch<void>(`/boards/${boardId}/blocks/${blockId}`, patch),

    patchBlocks: (boardId: string, patches: {block_ids: string[]; block_patches: Partial<Block>[]}) =>
        api.patch<void>(`/boards/${boardId}/blocks`, patches),

    deleteBlock: (boardId: string, blockId: string) =>
        api.del<void>(`/boards/${boardId}/blocks/${blockId}`),

    undeleteBlock: (boardId: string, blockId: string) =>
        api.post<Block>(`/boards/${boardId}/blocks/${blockId}/undelete`, {}),

    duplicateBlock: (boardId: string, blockId: string) =>
        api.post<Block[]>(`/boards/${boardId}/blocks/${blockId}/duplicate`, {}),
}
