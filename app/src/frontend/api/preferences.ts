import {api} from './client'
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'

// Type definitions
export type PreferencesConfig = Record<string, Record<string, string>>

export interface UpdatePreferenceRequest {
    category: string
    name: string
    value: string
}

// API client functions
export const preferencesApi = {
    getPreferences: () =>
        api.get<PreferencesConfig>('/users/me/config'),

    updatePreference: (userId: string, req: UpdatePreferenceRequest) =>
        api.put<PreferencesConfig>(`/users/${userId}/config`, req),
}

// React Query hooks
export function usePreferencesQuery() {
    return useQuery({
        queryKey: ['preferences'],
        queryFn: () => preferencesApi.getPreferences(),
    })
}

export function useUpdatePreferenceMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({userId, category, name, value}: {userId: string; category: string; name: string; value: string}) =>
            preferencesApi.updatePreference(userId, {category, name, value}),
        onSuccess: () => {
            // Invalidate preferences query to refetch latest data
            queryClient.invalidateQueries({queryKey: ['preferences']})
        },
    })
}
