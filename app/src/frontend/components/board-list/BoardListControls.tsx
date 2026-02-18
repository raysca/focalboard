import React from 'react'
import {Search, LayoutGrid, List, ChevronDown} from 'lucide-react'
import {cn} from '../../lib/cn'

export type LayoutMode = 'grid' | 'list'
export type FilterMode = 'all' | 'mine' | 'starred' | 'recent'
export type SortMode = 'activity' | 'name-asc' | 'name-desc' | 'created'

interface BoardListControlsProps {
    search: string
    onSearchChange: (v: string) => void
    filter: FilterMode
    onFilterChange: (v: FilterMode) => void
    sort: SortMode
    onSortChange: (v: SortMode) => void
    layout: LayoutMode
    onLayoutChange: (v: LayoutMode) => void
}

const FILTER_OPTIONS: {value: FilterMode; label: string}[] = [
    {value: 'all', label: 'All boards'},
    {value: 'mine', label: 'My boards'},
    {value: 'starred', label: 'Starred'},
    {value: 'recent', label: 'Recently viewed'},
]

const SORT_OPTIONS: {value: SortMode; label: string}[] = [
    {value: 'activity', label: 'Last activity'},
    {value: 'name-asc', label: 'Name (A–Z)'},
    {value: 'name-desc', label: 'Name (Z–A)'},
    {value: 'created', label: 'Date created'},
]

export function BoardListControls({
    search, onSearchChange,
    filter, onFilterChange,
    sort, onSortChange,
    layout, onLayoutChange,
}: BoardListControlsProps) {
    return (
        <div className="flex items-center gap-3 mb-6 flex-wrap" data-testid="board-list-controls">
            {/* Search */}
            <div className="flex items-center gap-2 px-3 h-9 rounded-[var(--radius-default)] bg-black/5 border border-black/5 focus-within:border-blue-400 transition-colors flex-1 min-w-[180px] max-w-sm">
                <Search size={14} className="text-center-fg/40 shrink-0" />
                <input
                    type="text"
                    placeholder="Search boards..."
                    value={search}
                    onChange={e => onSearchChange(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-center-fg/40"
                    data-testid="board-search-input"
                />
            </div>

            {/* Filter */}
            <div className="relative">
                <select
                    value={filter}
                    onChange={e => onFilterChange(e.target.value as FilterMode)}
                    className="appearance-none h-9 pl-3 pr-8 rounded-[var(--radius-default)] bg-white border border-black/10 text-sm cursor-pointer focus:outline-none focus:border-blue-400"
                    data-testid="board-filter-select"
                    aria-label="Filter boards"
                >
                    {FILTER_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-center-fg/40" />
            </div>

            {/* Sort */}
            <div className="relative">
                <select
                    value={sort}
                    onChange={e => onSortChange(e.target.value as SortMode)}
                    className="appearance-none h-9 pl-3 pr-8 rounded-[var(--radius-default)] bg-white border border-black/10 text-sm cursor-pointer focus:outline-none focus:border-blue-400"
                    data-testid="board-sort-select"
                    aria-label="Sort boards"
                >
                    {SORT_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-center-fg/40" />
            </div>

            {/* Layout toggle */}
            <div className="flex items-center border border-black/10 rounded-[var(--radius-default)] overflow-hidden">
                <button
                    onClick={() => onLayoutChange('grid')}
                    aria-label="Grid layout"
                    data-testid="layout-toggle-grid"
                    className={cn(
                        'flex items-center justify-center w-9 h-9 transition-colors',
                        layout === 'grid' ? 'bg-black/10 text-center-fg' : 'bg-white text-center-fg/40 hover:bg-black/5'
                    )}
                >
                    <LayoutGrid size={14} />
                </button>
                <button
                    onClick={() => onLayoutChange('list')}
                    aria-label="List layout"
                    data-testid="layout-toggle-list"
                    className={cn(
                        'flex items-center justify-center w-9 h-9 transition-colors',
                        layout === 'list' ? 'bg-black/10 text-center-fg' : 'bg-white text-center-fg/40 hover:bg-black/5'
                    )}
                >
                    <List size={14} />
                </button>
            </div>
        </div>
    )
}
