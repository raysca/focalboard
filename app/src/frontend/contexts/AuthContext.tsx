import React, {createContext, useContext, useState, useEffect} from 'react'
import {api} from '../api/client'
import type {User} from '../api/types'
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'

interface AuthContextType {
    user: User | null
    isLoggedIn: boolean
    isLoading: boolean
    login: (token: string) => void
    logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({children}: {children: React.ReactNode}) {
    const [token, setToken] = useState<string | null>(api.getToken())
    const queryClient = useQueryClient()

    const {data: user, isLoading} = useQuery({
        queryKey: ['me'],
        queryFn: () => api.get<User>('/users/me'),
        enabled: !!token,
        retry: false,
    })

    useEffect(() => {
        if (!token) {
            queryClient.setQueryData(['me'], null)
        }
    }, [token, queryClient])

    const login = (newToken: string) => {
        api.setToken(newToken)
        setToken(newToken)
        queryClient.invalidateQueries({queryKey: ['me']})
    }

    const logout = () => {
        api.clearToken()
        setToken(null)
        queryClient.setQueryData(['me'], null)
        queryClient.clear()
    }

    return (
        <AuthContext.Provider value={{user: user || null, isLoggedIn: !!user, isLoading, login, logout}}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth must be used within an AuthProvider')
    return context
}
