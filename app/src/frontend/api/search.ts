import {api} from './client'
import type {Board} from './types'

export const searchApi = {
    searchBoards: (q: string) =>
        api.get<Board[]>(`/boards/search?q=${encodeURIComponent(q)}`),

    searchTeamBoards: (teamId: string, q: string) =>
        api.get<Board[]>(`/teams/${teamId}/boards/search?q=${encodeURIComponent(q)}`),

    searchLinkableBoards: (teamId: string, q: string) =>
        api.get<Board[]>(`/teams/${teamId}/boards/search/linkable?q=${encodeURIComponent(q)}`),
}
