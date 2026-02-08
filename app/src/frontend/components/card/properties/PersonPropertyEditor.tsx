import React, {useState, useRef, useEffect, useMemo} from 'react'
import {X, Search, User as UserIcon} from 'lucide-react'
import {cn} from '../../../lib/cn'
import {useUserSearchQuery, useUsersByIdsQuery, getUserDisplay} from '../../../hooks/useUsers'
import type {User} from '../../../api/types'

interface PersonPropertyEditorProps {
    value: string   // userId or empty string
    onChange: (value: string) => void
}

export function PersonPropertyEditor({value, onChange}: PersonPropertyEditorProps) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Fetch current assigned user (if any) to display their name
    const {data: assignedUsers} = useUsersByIdsQuery(value ? [value] : [])
    const assignedUser = assignedUsers?.[0]

    // Search users when dropdown is open
    const {data: searchResults, isLoading} = useUserSearchQuery(search, open)

    // Deduplicate and sort results — put assigned user first if present
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

    const handleSelect = (user: User) => {
        onChange(user.id)
        setOpen(false)
        setSearch('')
    }

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation()
        onChange('')
        setOpen(false)
        setSearch('')
    }

    const display = assignedUser ? getUserDisplay(assignedUser) : null

    return (
        <div ref={containerRef} className="relative">
            {/* Current value display */}
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 min-h-[28px] px-1 rounded hover:bg-hover transition-colors cursor-pointer group w-full"
            >
                {display ? (
                    <>
                        <div className="w-5 h-5 rounded-full bg-button-bg/20 flex items-center justify-center text-[10px] font-bold text-button-bg shrink-0">
                            {display.initials}
                        </div>
                        <span className="text-xs text-center-fg truncate">{display.name}</span>
                        <button
                            onClick={handleClear}
                            className="ml-auto p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-center-fg/10 text-center-fg/40 hover:text-center-fg transition-all cursor-pointer"
                        >
                            <X size={12} />
                        </button>
                    </>
                ) : (
                    <span className="text-xs text-center-fg/30 flex items-center gap-1.5">
                        <UserIcon size={12} />
                        Assign...
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute top-full left-0 mt-1 w-[240px] bg-center-bg border border-border-default rounded-[var(--radius-default)] shadow-elevation-3 z-50 py-1">
                    {/* Search input */}
                    <div className="px-2 pb-1">
                        <div className="relative">
                            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-center-fg/30" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search users..."
                                className="w-full text-xs border border-border-default rounded pl-7 pr-2 py-1.5 bg-transparent outline-none focus:border-button-bg transition-colors"
                            />
                        </div>
                    </div>

                    {/* Clear option */}
                    {value && (
                        <button
                            onClick={handleClear}
                            className="w-full text-left px-3 py-1.5 text-xs text-center-fg/50 hover:bg-hover transition-colors cursor-pointer border-b border-border-default mb-1"
                        >
                            Unassign
                        </button>
                    )}

                    {/* User list */}
                    <div className="max-h-[200px] overflow-y-auto">
                        {isLoading && (
                            <div className="px-3 py-3 text-xs text-center-fg/40 text-center">Searching...</div>
                        )}

                        {!isLoading && filteredUsers.map((user) => {
                            const userDisplay = getUserDisplay(user)
                            const isSelected = user.id === value
                            return (
                                <button
                                    key={user.id}
                                    onClick={() => handleSelect(user)}
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
                                        <div className="text-button-bg text-[10px] font-medium shrink-0">✓</div>
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
