import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import {teamsApi} from '../api/teams'
import {useUpdatePreferenceMutation} from '../api/preferences'
import {useMeQuery} from './useAuth'

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

export function useOnboardMutation() {
    const queryClient = useQueryClient()
    const {data: user} = useMeQuery()
    const updatePreferenceMutation = useUpdatePreferenceMutation()

    return useMutation({
        mutationFn: (teamId: string) => teamsApi.onboard(teamId),
        onSuccess: async (data) => {
            if (!user?.id) return

            // Set tour preferences to start the onboarding tour
            await updatePreferenceMutation.mutateAsync({
                userId: user.id,
                category: 'onboarding',
                name: 'tourStarted',
                value: '1',
            })

            await updatePreferenceMutation.mutateAsync({
                userId: user.id,
                category: 'onboarding',
                name: 'tourCategory',
                value: 'onboarding',
            })

            await updatePreferenceMutation.mutateAsync({
                userId: user.id,
                category: 'onboarding',
                name: 'tourStep',
                value: '0',
            })

            // Invalidate boards query to refresh the UI with new board
            queryClient.invalidateQueries({queryKey: ['boards']})
        },
    })
}
