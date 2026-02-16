import {api} from './client'
import type {Team} from './types'

export const teamsApi = {
    getTeams: () =>
        api.get<Team[]>('/teams'),

    getTeam: (teamId: string) =>
        api.get<Team>(`/teams/${teamId}`),

    onboard: (teamId: string) =>
        api.post<{teamID: string; boardID: string}>(`/teams/${teamId}/onboard`, {}),
}
