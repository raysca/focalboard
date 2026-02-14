import React, {useState, useRef, useEffect, useMemo} from 'react'
import {X, Search, User as UserIcon, Check} from 'lucide-react'
import {cn} from '../../lib/cn'
import {useUserSearchQuery, useUsersByIdsQuery, getUserDisplay} from '../../hooks/useUsers'
import type {User} from '../../api/types'

interface UserMultiSelectProps {
    value: string[] // Array of user IDs
    onChange: (value: string[]) => void
    placeholder?: string
}

export function UserMultiSelect({value, onChange, placeholder = 'Assign members...'}: UserMultiSelectProps) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Fetch current assigned users to display their names
    const {data: assignedUsers} = useUsersByIdsQuery(value)

    // Search users when dropdown is open
    const {data: searchResults, isLoading} = useUserSearchQuery(search, open)

    // Deduplicate and filter results
    const filteredUsers = useMemo(() => {
        if (!searchResults) return []
        return searchResults
    }, [searchResults])

    useEffect(() => {
        if (!open) return
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false)
                setSearch('')
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [open])

    useEffect(() => {
        if (open && inputRef.current) {
            inputRef.current.focus()
        }
    }, [open])

    const handleToggleUser = (userId: string) => {
        if (value.includes(userId)) {
            onChange(value.filter((id) => id !== userId))
        } else {
            onChange([...value, userId])
        }
    }

    const handleRemoveUser = (e: React.MouseEvent, userId: string) => {
        e.stopPropagation()
        onChange(value.filter((id) => id !== userId))
    }

    return (
        <div ref={containerRef} className="relative">
            {/* Selected Users Display */}
            <div
                onClick={() => setOpen(!open)}
                className="min-h-[38px] w-full px-3 py-1.5 bg-transparent border border-border-default rounded-[var(--radius-default)] flex flex-wrap items-center gap-1.5 cursor-pointer hover:border-center-fg/30 transition-colors"
            >
                {assignedUsers && assignedUsers.length > 0 ? (
                    assignedUsers.map((user) => {
                        const display = getUserDisplay(user)
                        return (
                            <div
                                key={user.id}
                                className="flex items-center gap-1.5 pl-1.5 pr-1 py-0.5 bg-center-fg/5 rounded-full border border-border-default/50"
                            >
                                <div className="w-4 h-4 rounded-full bg-button-bg/20 flex items-center justify-center text-[9px] font-bold text-button-bg shrink-0">
                                    {display.initials}
                                </div>
                                <span className="text-xs text-center-fg max-w-[100px] truncate">{display.name}</span>
                                <button
                                    onClick={(e) => handleRemoveUser(e, user.id)}
                                    className="p-0.5 rounded-full hover:bg-center-fg/10 text-center-fg/40 hover:text-center-fg transition-colors"
                                >
                                    <X size={10} />
                                </button>
                            </div>
                        )
                    })
                ) : (
                    <span className="text-sm text-center-fg/30">{placeholder}</span>
                )}
            </div>

            {/* Dropdown */}
            {open && (
                <div className="absolute top-full left-0 mt-1 w-full bg-center-bg border border-border-default rounded-[var(--radius-default)] shadow-elevation-3 z-50 py-1">
                    {/* Search input */}
                    <div className="px-2 pb-1">
                        <div className="relative">
                            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-center-fg/30" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search users..."
                                className="w-full text-xs border border-border-default rounded pl-8 pr-2 py-1.5 bg-transparent outline-none focus:border-button-bg transition-colors"
                            />
                        </div>
                    </div>

                    {/* User list */}
                    <div className="max-h-[200px] overflow-y-auto mt-1">
                        {isLoading && (
                            <div className="px-3 py-3 text-xs text-center-fg/40 text-center">Searching...</div>
                        )}

                        {!isLoading && filteredUsers.map((user) => {
                            const userDisplay = getUserDisplay(user)
                            const isSelected = value.includes(user.id)
                            return (
                                <button
                                    key={user.id}
                                    onClick={() => handleToggleUser(user.id)}
                                    className={cn(
                                        'w-full text-left px-3 py-1.5 hover:bg-hover transition-colors cursor-pointer flex items-center gap-2.5',
                                        isSelected && 'bg-button-bg/5',
                                    )}
                                >
                                    <div className={cn(
                                        'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
                                        isSelected
                                            ? 'bg-button-bg text-button-fg'
                                            : 'bg-button-bg/15 text-button-bg',
                                    )}>
                                        {userDisplay.initials}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-xs font-medium text-center-fg truncate">{userDisplay.name}</div>
                                        {user.email && user.username && user.email !== user.username && (
                                            <div className="text-[10px] text-center-fg/40 truncate">{user.email}</div>
                                        )}
                                    </div>
                                    {isSelected && (
                                        <Check size={14} className="text-button-bg shrink-0" />
                                    )}
                                </button>
                            )
                        })}

                        {!isLoading && filteredUsers.length === 0 && (
                            <div className="px-3 py-3 text-xs text-center-fg/40 text-center">
                                {search ? 'No users found' : 'No users available'}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
