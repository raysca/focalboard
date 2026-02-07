import React, {useMemo, useState} from 'react'
import {createRoute, Outlet, useNavigate} from '@tanstack/react-router'
import {Route as authRoute} from './_auth'
import {useBoardQuery, usePatchBoardMutation} from '../hooks/useBoards'
import {useBoardDataQuery} from '../hooks/useBlocks'
import {Editable} from '../components/ui/Editable'
import {ViewHeader} from '../components/viewHeader/ViewHeader'
import {KanbanView} from '../components/board/KanbanView'
import {TableView} from '../components/board/TableView'
import {GalleryView} from '../components/board/GalleryView'
import {CalendarView} from '../components/board/CalendarView'
import {SkeletonKanban} from '../components/ui/Skeleton'
import {ErrorBoundary} from '../components/ui/ErrorBoundary'
import type {BoardView, Card} from '../api/types'

export const Route = createRoute({
    getParentRoute: () => authRoute,
    path: '/board/$boardId',
    component: BoardPage,
})

function BoardPage() {
    const {boardId} = Route.useParams()
    const navigate = useNavigate()
    const {data: board, isLoading: boardLoading} = useBoardQuery(boardId)
    const {data: blockData, isLoading: blocksLoading} = useBoardDataQuery(boardId)
    const patchBoard = usePatchBoardMutation()

    const views = blockData?.views || []
    const cards = blockData?.cards || []
    const contents = blockData?.contents || []

    // Active view: use first view or URL param
    const [activeViewId, setActiveViewId] = useState<string | null>(null)
    const activeView = useMemo(() => {
        if (activeViewId) {
            return views.find((v: BoardView) => v.id === activeViewId) || views[0]
        }
        return views[0]
    }, [activeViewId, views])

    if (boardLoading || blocksLoading) {
        return (
            <div className="flex-1 overflow-hidden">
                <div className="px-6 pt-5 pb-4">
                    <div className="h-6 w-48 bg-center-fg/10 rounded animate-pulse" />
                </div>
                <SkeletonKanban />
            </div>
        )
    }

    if (!board) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center-fg/40 text-sm">Board not found</div>
            </div>
        )
    }

    const viewType = activeView?.fields?.viewType || 'board'

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Board title */}
            <div className="px-6 pt-5 pb-2">
                <div className="flex items-center gap-2">
                    {board.icon && <span className="text-2xl">{board.icon}</span>}
                    <Editable
                        value={board.title || ''}
                        onChange={(title) => patchBoard.mutate({boardId: board.id, patch: {title}})}
                        placeholder="Untitled"
                        className="text-xl font-bold text-center-fg"
                        inputClassName="text-xl font-bold"
                    />
                </div>
                {board.showDescription && board.description && (
                    <Editable
                        value={board.description}
                        onChange={(description) => patchBoard.mutate({boardId: board.id, patch: {description}})}
                        placeholder="Add a description..."
                        className="text-sm text-center-fg/60 mt-1"
                        inputClassName="text-sm"
                    />
                )}
            </div>

            {/* View header */}
            <ViewHeader
                board={board}
                views={views}
                activeView={activeView}
                onViewChange={(viewId) => setActiveViewId(viewId)}
                cards={cards}
            />

            {/* View content */}
            <ErrorBoundary>
            <div className="flex-1 overflow-auto">
                {viewType === 'board' && (
                    <KanbanView
                        board={board}
                        cards={cards}
                        activeView={activeView}
                        contents={contents}
                    />
                )}
                {viewType === 'table' && (
                    <TableView
                        board={board}
                        cards={cards}
                        activeView={activeView}
                    />
                )}
                {viewType === 'gallery' && (
                    <GalleryView
                        board={board}
                        cards={cards}
                        activeView={activeView}
                    />
                )}
                {viewType === 'calendar' && (
                    <CalendarView
                        board={board}
                        cards={cards}
                        activeView={activeView}
                    />
                )}
                {views.length === 0 && (
                    <div className="flex-1 flex items-center justify-center p-8 text-center-fg/40 text-sm">
                        No views yet. This board needs a view to display cards.
                    </div>
                )}
            </div>
            </ErrorBoundary>

            {/* Card dialog outlet (for nested card route) */}
            <Outlet />
        </div>
    )
}
