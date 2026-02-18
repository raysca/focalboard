import React, {useState, useMemo} from 'react'
import {createRoute} from '@tanstack/react-router'
import {Route as authRoute} from './_auth'
import {Layout} from 'lucide-react'
import {useMeQuery} from '../hooks/useAuth'
import {useBoardsQuery, useToggleFavoriteMutation, useDeleteBoardMutation, useDuplicateBoardMutation} from '../hooks/useBoards'
import {useRecentlyViewed} from '../hooks/useRecentlyViewed'
import {DEFAULT_TEAM_ID} from '../lib/constants'
import {Skeleton} from '../components/ui/Skeleton'
import {CreateBoardDialog} from '../components/board/CreateBoardDialog'
import {BoardListControls, type LayoutMode, type FilterMode, type SortMode} from '../components/board-list/BoardListControls'
import {BoardListSection} from '../components/board-list/BoardListSection'
import type {Board} from '../api/types'

export const Route = createRoute({
    getParentRoute: () => authRoute,
    path: '/boards',
    component: BoardListPage,
})

function applySort(boards: Board[], sort: SortMode): Board[] {
    return [...boards].sort((a, b) => {
        switch (sort) {
            case 'name-asc': return a.title.localeCompare(b.title)
            case 'name-desc': return b.title.localeCompare(a.title)
            case 'created': return b.createAt - a.createAt
            case 'activity':
            default: return b.updateAt - a.updateAt
        }
    })
}

function BoardListPage() {
    const {data: user} = useMeQuery()
    const {data: allBoards = [], isLoading} = useBoardsQuery(DEFAULT_TEAM_ID)
    const {recentlyViewed} = useRecentlyViewed()
    const toggleFavorite = useToggleFavoriteMutation()
    const deleteBoard = useDeleteBoardMutation(DEFAULT_TEAM_ID)
    const duplicateBoard = useDuplicateBoardMutation(DEFAULT_TEAM_ID)

    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState<FilterMode>('all')
    const [sort, setSort] = useState<SortMode>('activity')
    const [layout, setLayout] = useState<LayoutMode>('grid')

    const nonTemplateBoards = useMemo(
        () => allBoards.filter((b: Board) => !b.isTemplate && b.deleteAt === 0),
        [allBoards]
    )

    const searchFiltered = useMemo(() => {
        const term = search.toLowerCase().trim()
        if (!term) return nonTemplateBoards
        return nonTemplateBoards.filter(b =>
            b.title.toLowerCase().includes(term) || b.description.toLowerCase().includes(term)
        )
    }, [nonTemplateBoards, search])

    const handleStar = (boardId: string) => toggleFavorite.mutate({boardId})
    const handleCopy = (boardId: string) => duplicateBoard.mutate(boardId)
    const handleDelete = (boardId: string) => {
        if (window.confirm('Delete this board? This cannot be undone.')) {
            deleteBoard.mutate(boardId)
        }
    }

    const sharedHandlers = {onStar: handleStar, onCopy: handleCopy, onDelete: handleDelete}

    const sections = useMemo(() => {
        if (filter === 'starred') {
            return {starred: applySort(searchFiltered.filter(b => b.isFavorite), sort)}
        }
        if (filter === 'mine') {
            return {mine: applySort(searchFiltered.filter(b => b.createdBy === user?.id), sort)}
        }
        if (filter === 'recent') {
            const recentIds = new Set(recentlyViewed.map(r => r.boardId))
            return {recent: applySort(searchFiltered.filter(b => recentIds.has(b.id)), sort)}
        }
        // Default 'all' — show grouped sections
        const starredBoards = applySort(searchFiltered.filter(b => b.isFavorite), sort)
        const recentIds = new Set(recentlyViewed.slice(0, 8).map(r => r.boardId))
        const recentBoards = recentlyViewed
            .map(r => searchFiltered.find(b => b.id === r.boardId))
            .filter((b): b is Board => !!b)
        const myBoards = applySort(
            searchFiltered.filter(b => b.createdBy === user?.id && !b.isFavorite),
            sort
        )
        const otherBoards = applySort(
            searchFiltered.filter(b => b.createdBy !== user?.id && !b.isFavorite && !recentIds.has(b.id)),
            sort
        )
        return {starred: starredBoards, recent: recentBoards, mine: myBoards, other: otherBoards}
    }, [searchFiltered, filter, sort, recentlyViewed, user?.id])

    if (isLoading) {
        return (
            <div className="flex-1 p-8 max-w-6xl mx-auto w-full">
                <Skeleton className="h-9 w-64 mb-6" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-36 rounded-[var(--radius-default)]" />)}
                </div>
            </div>
        )
    }

    const hasBoards = nonTemplateBoards.length > 0
    const hasResults = searchFiltered.length > 0

    return (
        <div className="flex-1 p-8 max-w-6xl mx-auto w-full overflow-y-auto">
            <header className="mb-6 flex items-center gap-3">
                <Layout className="w-6 h-6 text-center-fg/50" />
                <h1 className="text-2xl font-semibold text-center-fg">All Boards</h1>
            </header>

            {/* Empty state - no boards at all */}
            {!hasBoards && (
                <div
                    className="text-center py-16 bg-black/[0.02] rounded-[var(--radius-default)] border border-dashed border-black/10"
                    data-testid="empty-state"
                >
                    <Layout className="w-12 h-12 mx-auto text-center-fg/20 mb-3" />
                    <h3 className="text-lg font-medium text-center-fg/70 mb-1">No boards yet</h3>
                    <p className="text-center-fg/50 mb-5">Create your first board to get started.</p>
                    <button
                        onClick={() => setShowCreateDialog(true)}
                        className="px-5 py-2 bg-button-bg text-button-fg rounded-[var(--radius-default)] hover:opacity-90 font-medium"
                        data-testid="create-board-button"
                    >
                        Create Board
                    </button>
                </div>
            )}

            {/* Controls - only shown when boards exist */}
            {hasBoards && (
                <BoardListControls
                    search={search}
                    onSearchChange={setSearch}
                    filter={filter}
                    onFilterChange={setFilter}
                    sort={sort}
                    onSortChange={setSort}
                    layout={layout}
                    onLayoutChange={setLayout}
                />
            )}

            {/* No search results */}
            {hasBoards && !hasResults && (
                <div className="text-center py-12" data-testid="no-results-state">
                    <p className="text-center-fg/50 mb-2">No boards found for "{search}"</p>
                    <button
                        onClick={() => setSearch('')}
                        className="text-sm text-blue-600 hover:underline"
                    >
                        Clear search
                    </button>
                </div>
            )}

            {/* Sections */}
            {hasBoards && hasResults && (
                <>
                    {filter === 'starred' && (
                        <BoardListSection
                            title="Starred"
                            boards={sections.starred ?? []}
                            layout={layout}
                            {...sharedHandlers}
                            testId="section-starred"
                        />
                    )}
                    {filter === 'mine' && (
                        <BoardListSection
                            title="My Boards"
                            boards={sections.mine ?? []}
                            layout={layout}
                            {...sharedHandlers}
                            showCreateButton
                            onCreateClick={() => setShowCreateDialog(true)}
                            testId="section-mine"
                        />
                    )}
                    {filter === 'recent' && (
                        <BoardListSection
                            title="Recently Viewed"
                            boards={sections.recent ?? []}
                            layout={layout}
                            {...sharedHandlers}
                            testId="section-recent"
                        />
                    )}
                    {filter === 'all' && (
                        <>
                            {(sections.starred?.length ?? 0) > 0 && (
                                <BoardListSection
                                    title="Starred"
                                    boards={sections.starred!}
                                    layout={layout}
                                    {...sharedHandlers}
                                    testId="section-starred"
                                />
                            )}
                            {(sections.recent?.length ?? 0) > 0 && (
                                <BoardListSection
                                    title="Recently Viewed"
                                    boards={sections.recent!}
                                    layout={layout}
                                    {...sharedHandlers}
                                    testId="section-recent"
                                />
                            )}
                            {(sections.mine?.length ?? 0) > 0 && (
                                <BoardListSection
                                    title="My Boards"
                                    boards={sections.mine!}
                                    layout={layout}
                                    {...sharedHandlers}
                                    testId="section-mine"
                                />
                            )}
                            {(sections.other?.length ?? 0) > 0 && (
                                <BoardListSection
                                    title="All Boards"
                                    boards={sections.other!}
                                    layout={layout}
                                    {...sharedHandlers}
                                    testId="section-all"
                                />
                            )}
                            {(sections.mine?.length ?? 0) === 0 && (sections.starred?.length ?? 0) === 0 && (
                                <BoardListSection
                                    title="All Boards"
                                    boards={searchFiltered}
                                    layout={layout}
                                    {...sharedHandlers}
                                    showCreateButton
                                    onCreateClick={() => setShowCreateDialog(true)}
                                    testId="section-all"
                                />
                            )}
                        </>
                    )}
                </>
            )}

            <CreateBoardDialog
                open={showCreateDialog}
                onClose={() => setShowCreateDialog(false)}
                teamId={DEFAULT_TEAM_ID}
            />
        </div>
    )
}
