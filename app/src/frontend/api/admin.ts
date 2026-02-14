import { api } from './client'

export interface AdminSetting {
    id: string
    category: string
    key: string
    value: unknown
    valueType: string
    defaultValue: unknown
    description: string
    isPublic: boolean
    constraints: Record<string, unknown>
    modifiedBy: string | null
    createAt: number
    updateAt: number
}

export interface SettingHistoryEntry {
    id: string
    category: string
    key: string
    oldValue: unknown
    newValue: unknown
    changedBy: string
    changedAt: number
    reason: string | null
}

export interface UserListItem {
    id: string
    name: string
    email: string
    emailVerified: boolean
    username: string | null
    firstName: string | null
    lastName: string | null
    roles: string
    isGuest: boolean
    isBot: boolean
}

// Settings endpoints
export async function getSettings(category?: string): Promise<AdminSetting[]> {
    const url = category ? `/admin/settings?category=${category}` : '/admin/settings'
    const response = await api.get(url)
    return response.settings
}

export async function getSetting(id: string): Promise<AdminSetting> {
    const response = await api.get(`/admin/settings/${id}`)
    return response.setting
}

export async function updateSetting(
    id: string,
    value: unknown,
    reason?: string
): Promise<AdminSetting> {
    const response = await api.put(`/admin/settings/${id}`, {
        value,
        reason,
    })
    return response.setting
}

export async function bulkUpdateSettings(
    updates: Array<{ id: string; value: unknown }>
): Promise<AdminSetting[]> {
    const response = await api.put('/admin/settings', updates)
    return response.settings
}

export async function resetSetting(id: string): Promise<AdminSetting> {
    const response = await api.post(`/admin/settings/reset/${id}`, {})
    return response.setting
}

export async function getSettingHistory(
    id: string,
    limit = 50
): Promise<SettingHistoryEntry[]> {
    const response = await api.get(
        `/admin/settings/${id}/history?limit=${limit}`
    )
    return response.history
}

// User management endpoints
export async function getUsers(
    page = 0,
    perPage = 50,
    search?: string
): Promise<{ users: UserListItem[]; page: number; perPage: number; hasMore: boolean }> {
    let url = `/admin/users?page=${page}&per_page=${perPage}`
    if (search) {
        url += `&search=${encodeURIComponent(search)}`
    }
    return await api.get(url)
}

export async function updateUserRole(
    userId: string,
    role: 'admin' | 'user'
): Promise<{ userId: string; roles: string }> {
    const response = await api.put(`/admin/users/${userId}/role`, {
        role,
    })
    return response.user
}

export async function disableUser(userId: string): Promise<void> {
    await api.post(`/admin/users/${userId}/disable`, {})
}
