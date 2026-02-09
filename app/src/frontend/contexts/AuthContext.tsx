import React, {createContext, useContext, useState, useEffect} from 'react'
import type {User} from '../api/types'
import {useQueryClient} from '@tanstack/react-query'

interface AuthContextType {
    user: User | null
    isLoggedIn: boolean
    isLoading: boolean
    logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({children}: {children: React.ReactNode}) {
    const queryClient = useQueryClient()
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    // Get user from query cache instead of making a new query
    // This prevents infinite loops on logout
    useEffect(() => {
        const cachedUser = queryClient.getQueryData<User>(['me'])
        if (cachedUser) {
            setUser(cachedUser)
        }
    }, [queryClient])

    const logout = () => {
        setUser(null)
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
