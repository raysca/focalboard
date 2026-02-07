import React, {createContext, useContext, useState, useEffect} from 'react'
import {THEME_KEY} from '../lib/constants'

export type ThemeOption = 'default' | 'light' | 'dark' | 'system'

interface UIContextType {
    sidebarCollapsed: boolean
    toggleSidebar: () => void
    theme: ThemeOption
    setTheme: (theme: ThemeOption) => void
    activeCardId: string | null
    setActiveCardId: (id: string | null) => void
}

const UIContext = createContext<UIContextType | undefined>(undefined)

export function UIProvider({children}: {children: React.ReactNode}) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [activeCardId, setActiveCardId] = useState<string | null>(null)
    const [theme, setThemeState] = useState<ThemeOption>(() => {
        return (localStorage.getItem(THEME_KEY) as ThemeOption) || 'default'
    })

    useEffect(() => {
        const root = window.document.documentElement
        root.removeAttribute('data-theme')

        if (theme === 'default') {
            // No data-theme attribute — uses base @theme tokens (navy sidebar)
        } else if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
            root.setAttribute('data-theme', systemTheme)
        } else {
            root.setAttribute('data-theme', theme)
        }
        localStorage.setItem(THEME_KEY, theme)
    }, [theme])

    const setTheme = (t: ThemeOption) => {
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
