import React, {createContext, useContext} from 'react'
import type {User} from '../api/types'
import {useQueryClient} from '@tanstack/react-query'
import {useMeQuery} from '../hooks/useAuth'

interface AuthContextType {
    user: User | null
    isLoggedIn: boolean
    isLoading: boolean
    logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({children}: {children: React.ReactNode}) {
    const queryClient = useQueryClient()
    const {data: user, isLoading} = useMeQuery()

    const logout = () => {
        queryClient.setQueryData(['me'], null)
        queryClient.clear()
    }

    return (
        <AuthContext.Provider value={{user: user || null, isLoggedIn: !!user, isLoading, logout}}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth must be used within an AuthProvider')
    return context
}
