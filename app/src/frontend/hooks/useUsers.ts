import {useQuery} from '@tanstack/react-query'
import {api} from '../api/client'
import {DEFAULT_TEAM_ID} from '../lib/constants'
import type {User} from '../api/types'

/**
 * Search users by query (username match).
 * If query is empty, returns all users.
 */
export function useUserSearchQuery(query: string, enabled = true) {
    return useQuery({
        queryKey: ['users', 'search', query],
        queryFn: () => {
            const params = query ? `?search=${encodeURIComponent(query)}&exclude_bots=true` : '?exclude_bots=true'
            return api.get<User[]>(`/teams/${DEFAULT_TEAM_ID}/users${params}`)
        },
        enabled,
        staleTime: 30_000, // cache user searches for 30s
    })
}

/**
 * Fetch users by a list of IDs.
 * Used to resolve user display names for person properties.
 */
export function useUsersByIdsQuery(userIds: string[]) {
    const validIds = userIds.filter(Boolean)
    return useQuery({
        queryKey: ['users', 'byIds', ...validIds.sort()],
        queryFn: () => api.post<User[]>(`/teams/${DEFAULT_TEAM_ID}/users`, validIds),
        enabled: validIds.length > 0,
        staleTime: 60_000, // cache for 1 minute
    })
}

/**
 * Helper to get display info for a user.
 */
export function getUserDisplay(user: User) {
    const name = user.username || user.email || user.id
    const initials = (user.username || user.email || '?').charAt(0).toUpperCase()
    return {name, initials}
}
