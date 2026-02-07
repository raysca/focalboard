import {api} from './client'
import type {Board} from './types'

export const boardsApi = {
    getBoards: (teamId: string) =>
        api.get<Board[]>(`/teams/${teamId}/boards`),

    getBoard: (boardId: string) =>
        api.get<Board>(`/boards/${boardId}`),

    createBoard: (board: Partial<Board>) =>
        api.post<Board>('/boards', board),

    patchBoard: (boardId: string, patch: Partial<Board>) =>
        api.patch<Board>(`/boards/${boardId}`, patch),

    deleteBoard: (boardId: string) =>
        api.del<void>(`/boards/${boardId}`),

    duplicateBoard: (boardId: string) =>
        api.post<{boards: Board[]}>(`/boards/${boardId}/duplicate`, {}),

    undeleteBoard: (boardId: string) =>
        api.post<Board>(`/boards/${boardId}/undelete`, {}),
}
