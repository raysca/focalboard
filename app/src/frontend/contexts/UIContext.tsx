import React, {createContext, useContext, useState, useEffect} from 'react'
import {THEME_KEY} from '../lib/constants'

interface UIContextType {
    sidebarCollapsed: boolean
    toggleSidebar: () => void
    theme: 'light' | 'dark' | 'system'
    setTheme: (theme: 'light' | 'dark' | 'system') => void
    activeCardId: string | null
    setActiveCardId: (id: string | null) => void
}

const UIContext = createContext<UIContextType | undefined>(undefined)

export function UIProvider({children}: {children: React.ReactNode}) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [activeCardId, setActiveCardId] = useState<string | null>(null)
    const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>(() => {
        return (localStorage.getItem(THEME_KEY) as 'light' | 'dark' | 'system') || 'system'
    })

    useEffect(() => {
        const root = window.document.documentElement
        root.removeAttribute('data-theme')

        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
            root.setAttribute('data-theme', systemTheme)
        } else {
            root.setAttribute('data-theme', theme)
        }
        localStorage.setItem(THEME_KEY, theme)
    }, [theme])

    const setTheme = (t: 'light' | 'dark' | 'system') => {
        setThemeState(t)
    }

    const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed)

    return (
        <UIContext.Provider value={{sidebarCollapsed, toggleSidebar, theme, setTheme, activeCardId, setActiveCardId}}>
            {children}
        </UIContext.Provider>
    )
}

export const useUI = () => {
    const context = useContext(UIContext)
    if (!context) throw new Error('useUI must be used within a UIProvider')
    return context
}
