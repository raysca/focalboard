import {api} from './client'
import {User} from './types'

export const auth = {
    login: (data: {email?: string; username?: string; password?: string}) =>
        api.post<{token: string; user: User}>('/login', data),

    register: (data: {username: string; email: string; password?: string}) =>
        api.post<{token: string; user: User}>('/register', data),

    getMe: () => api.get<User>('/users/me'),

    logout: () => api.post('/logout', {}),

    changePassword: (userId: string, data: {oldPassword?: string; newPassword?: string}) =>
        api.post(`/users/${userId}/changepassword`, data),
}
