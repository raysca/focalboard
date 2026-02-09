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
    const [user, setUser] = useState<User | null>(() => {
        // Initialize from cache
        return queryClient.getQueryData<User>(['me']) || null
    })
    const [isLoading, setIsLoading] = useState(false)

    // Subscribe to query cache changes
    useEffect(() => {
        const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
            if (event?.query.queryKey[0] === 'me') {
                const cachedUser = queryClient.getQueryData<User>(['me'])
                setUser(cachedUser || null)
            }
        })

        return () => unsubscribe()
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
