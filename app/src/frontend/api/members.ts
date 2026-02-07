import {api} from './client'
import type {BoardMember} from './types'

export const membersApi = {
    getMembers: (boardId: string) =>
        api.get<BoardMember[]>(`/boards/${boardId}/members`),

    addMember: (boardId: string, member: {userId: string; schemeAdmin?: boolean; schemeEditor?: boolean; schemeViewer?: boolean}) =>
        api.post<BoardMember>(`/boards/${boardId}/members`, member),

    updateMember: (boardId: string, userId: string, patch: Partial<BoardMember>) =>
        api.put<BoardMember>(`/boards/${boardId}/members/${userId}`, patch),

    removeMember: (boardId: string, userId: string) =>
        api.del<void>(`/boards/${boardId}/members/${userId}`),

    joinBoard: (boardId: string) =>
        api.post<BoardMember>(`/boards/${boardId}/join`, {}),

    leaveBoard: (boardId: string) =>
        api.post<void>(`/boards/${boardId}/leave`, {}),
}
