import React, {useState, useRef, useEffect} from 'react'
import {Search, X} from 'lucide-react'
import {useNavigate} from '@tanstack/react-router'
import {searchApi} from '../../api/search'
import type {Board} from '../../api/types'

interface BoardSearchProps {
    teamId: string
}

export function BoardSearch({teamId}: BoardSearchProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<Board[]>([])
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const navigate = useNavigate()
    const debounceRef = useRef<ReturnType<typeof setTimeout>>()

    useEffect(() => {
        if (!open) return
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [open])

    const handleSearch = (value: string) => {
        setQuery(value)
        if (debounceRef.current) clearTimeout(debounceRef.current)

        if (!value.trim()) {
            setResults([])
            return
        }

        debounceRef.current = setTimeout(async () => {
            setLoading(true)
            try {
                const boards = await searchApi.searchTeamBoards(teamId, value)
                setResults(boards.filter((b: Board) => !b.isTemplate))
            } catch {
                setResults([])
            }
            setLoading(false)
        }, 300)
    }

    const handleSelect = (board: Board) => {
        navigate({to: '/board/$boardId', params: {boardId: board.id}})
        setOpen(false)
        setQuery('')
        setResults([])
    }

    return (
        <div ref={containerRef} className="relative">
            <div className="flex items-center h-8 px-2 rounded bg-white/10 text-sidebar-text-secondary">
                <Search size={14} className="shrink-0 mr-2" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => setOpen(true)}
                    placeholder="Search boards..."
                    className="w-full bg-transparent text-xs text-sidebar-fg placeholder:text-sidebar-text-secondary border-none outline-none"
                />
                {query && (
                    <button onClick={() => { setQuery(''); setResults([]) }} className="cursor-pointer">
                        <X size={12} />
                    </button>
                )}
            </div>

            {open && query && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-center-bg text-center-fg border border-border-default rounded-[var(--radius-default)] shadow-elevation-3 z-50 max-h-[200px] overflow-y-auto">
                    {loading ? (
                        <div className="px-3 py-2 text-xs text-center-fg/50">Searching...</div>
                    ) : results.length > 0 ? (
                        results.map((board) => (
                            <button
                                key={board.id}
                                onClick={() => handleSelect(board)}
                                className="w-full text-left px-3 py-2 hover:bg-hover transition-colors cursor-pointer flex items-center gap-2"
                            >
                                {board.icon && <span className="text-sm">{board.icon}</span>}
                                <span className="text-sm truncate">{board.title || 'Untitled'}</span>
                            </button>
                        ))
                    ) : (
                        <div className="px-3 py-2 text-xs text-center-fg/50">No boards found</div>
                    )}
                </div>
            )}
        </div>
    )
}
