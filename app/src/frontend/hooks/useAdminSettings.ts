import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    getSettings,
    getSetting,
    updateSetting,
    bulkUpdateSettings,
    resetSetting,
    getSettingHistory,
    getUsers,
    updateUserRole,
    disableUser,
} from '../api/admin'
import type { AdminSetting } from '../api/admin'

// Query keys
export const adminKeys = {
    all: ['admin'] as const,
    settings: () => [...adminKeys.all, 'settings'] as const,
    settingsByCategory: (category?: string) =>
        [...adminKeys.settings(), category] as const,
    setting: (id: string) => [...adminKeys.settings(), id] as const,
    settingHistory: (id: string) => [...adminKeys.setting(id), 'history'] as const,
    users: () => [...adminKeys.all, 'users'] as const,
    usersList: (page: number, search?: string) =>
        [...adminKeys.users(), page, search] as const,
}

// Settings hooks
export function useSettings(category?: string) {
    return useQuery({
        queryKey: adminKeys.settingsByCategory(category),
        queryFn: () => getSettings(category),
    })
}

export function useSetting(id: string) {
    return useQuery({
        queryKey: adminKeys.setting(id),
        queryFn: () => getSetting(id),
    })
}

export function useUpdateSetting() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({
            id,
            value,
            reason,
        }: {
            id: string
            value: unknown
            reason?: string
        }) => updateSetting(id, value, reason),
        onSuccess: (data) => {
            // Invalidate all settings queries to refresh data
            queryClient.invalidateQueries({ queryKey: adminKeys.settings() })
            queryClient.invalidateQueries({ queryKey: adminKeys.setting(data.id) })
        },
    })
}

export function useBulkUpdateSettings() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (updates: Array<{ id: string; value: unknown }>) =>
            bulkUpdateSettings(updates),
        onSuccess: () => {
            // Invalidate all settings queries
            queryClient.invalidateQueries({ queryKey: adminKeys.settings() })
        },
    })
}

export function useResetSetting() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => resetSetting(id),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: adminKeys.settings() })
            queryClient.invalidateQueries({ queryKey: adminKeys.setting(data.id) })
        },
    })
}

export function useSettingHistory(id: string, limit = 50) {
    return useQuery({
        queryKey: adminKeys.settingHistory(id),
        queryFn: () => getSettingHistory(id, limit),
    })
}

// User management hooks
export function useUsers(page = 0, perPage = 50, search?: string) {
    return useQuery({
        queryKey: adminKeys.usersList(page, search),
        queryFn: () => getUsers(page, perPage, search),
    })
}

export function useUpdateUserRole() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ userId, role }: { userId: string; role: 'admin' | 'user' }) =>
            updateUserRole(userId, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminKeys.users() })
        },
    })
}

export function useDisableUser() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (userId: string) => disableUser(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminKeys.users() })
        },
    })
}
