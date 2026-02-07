import {useQuery} from '@tanstack/react-query'
import {teamsApi} from '../api/teams'

export function useTeamsQuery() {
    return useQuery({
        queryKey: ['teams'],
        queryFn: teamsApi.getTeams,
    })
}

export function useTeamQuery(teamId: string) {
    return useQuery({
        queryKey: ['team', teamId],
        queryFn: () => teamsApi.getTeam(teamId),
        enabled: !!teamId,
    })
}
