import {api} from './client'
import type {Sharing} from './types'

export const sharingApi = {
    getSharing: (boardId: string) =>
        api.get<Sharing>(`/boards/${boardId}/sharing`),

    setSharing: (boardId: string, sharing: Partial<Sharing>) =>
        api.post<void>(`/boards/${boardId}/sharing`, sharing),
}
