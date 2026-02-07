import React, {useState} from 'react'
import {LogOut, Settings, Sun, Moon, Monitor, Palette} from 'lucide-react'
import {useAuth} from '../../contexts/AuthContext'
import {useUI} from '../../contexts/UIContext'
import {useLogoutMutation} from '../../hooks/useAuth'
import {cn} from '../../lib/cn'

export function SidebarUserMenu() {
    const {user} = useAuth()
    const {theme, setTheme} = useUI()
    const logoutMutation = useLogoutMutation()
    const [showMenu, setShowMenu] = useState(false)

    const displayName = user?.username || user?.email || 'User'
    const initials = displayName.charAt(0).toUpperCase()

    const themeOptions = [
        {value: 'default' as const, label: 'Default', icon: Palette},
        {value: 'dark' as const, label: 'Dark', icon: Moon},
        {value: 'light' as const, label: 'Light', icon: Sun},
        {value: 'system' as const, label: 'System', icon: Monitor},
    ]

    return (
        <div className="relative border-t border-white/10">
            <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center w-full h-12 px-4 text-sidebar-text-primary hover:bg-white/10 transition-colors cursor-pointer"
            >
                <div className="w-7 h-7 rounded-full bg-button-bg flex items-center justify-center text-xs font-bold text-white mr-2 shrink-0">
                    {initials}
                </div>
                <span className="text-sm truncate">{displayName}</span>
            </button>

            {showMenu && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                    <div className="absolute bottom-full left-2 right-2 mb-1 z-50 bg-center-bg text-center-fg rounded-modal shadow-elevation-3 py-1 border border-border-default">
                        {/* Theme switcher */}
                        <div className="px-3 py-2">
                            <div className="text-[11px] font-semibold uppercase tracking-wider text-center-fg/50 mb-2">Theme</div>
                            <div className="flex gap-1">
                                {themeOptions.map(({value, label, icon: Icon}) => (
                                    <button
                                        key={value}
                                        onClick={() => setTheme(value)}
                                        className={cn(
                                            'flex-1 flex items-center justify-center gap-1 h-7 rounded text-xs transition-colors cursor-pointer',
                                            theme === value
                                                ? 'bg-button-bg text-button-fg'
                                                : 'hover:bg-hover text-center-fg/70'
                                        )}
                                    >
                                        <Icon size={12} />
                                        <span>{label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="h-px bg-border-default mx-2 my-1" />

                        {/* Logout */}
                        <button
                            onClick={() => logoutMutation.mutate()}
                            className="flex items-center w-full h-8 px-3 text-sm text-center-fg/80 hover:bg-hover transition-colors cursor-pointer"
                        >
                            <LogOut size={14} className="mr-2" />
                            Log out
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}
