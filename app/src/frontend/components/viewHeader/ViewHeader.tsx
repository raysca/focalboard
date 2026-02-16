import React, {useState, useCallback} from 'react'
import {Plus, LayoutGrid, Table, Image, Calendar, Share2, Users, Filter, Save, User, Lock, Star} from 'lucide-react'
import {cn} from '../../lib/cn'
import {useTourContext} from '../../contexts/TourContext'
import {useInsertBlocksMutation, usePatchBlockMutation, useFilteredViews} from '../../hooks/useBlocks'
import {useToggleFavoriteMutation} from '../../hooks/useBoards'
import {ShareBoardDialog} from '../board/ShareBoardDialog'
import {MembersDialog} from '../board/MembersDialog'
import {FilterComponent} from './FilterComponent'
import {SaveViewDialog} from './SaveViewDialog'
import type {Board, BoardView, Card, FilterGroup, ViewVisibility} from '../../api/types'

interface ViewHeaderProps {
    board: Board
    views: BoardView[]
    activeView?: BoardView
    onViewChange: (viewId: string) => void
    cards: Card[]
    currentUserId?: string
}

const viewTypeIcons: Record<string, React.ElementType> = {
    board: LayoutGrid,
    table: Table,
    gallery: Image,
    calendar: Calendar,
}

const viewTypeLabels: Record<string, string> = {
    board: 'Board',
    table: 'Table',
    gallery: 'Gallery',
    calendar: 'Calendar',
}

export function ViewHeader({board, views, activeView, onViewChange, cards, currentUserId}: ViewHeaderProps) {
    const {isOnboardingBoard} = useTourContext()
    const insertBlocks = useInsertBlocksMutation(board?.id || '')
    const patchBlock = usePatchBlockMutation(board?.id || '')
    const [showShareDialog, setShowShareDialog] = useState(false)
    const [showMembersDialog, setShowMembersDialog] = useState(false)
    const [showFilter, setShowFilter] = useState(false)
    const [showSaveViewDialog, setShowSaveViewDialog] = useState(false)
    const toggleFavorite = useToggleFavoriteMutation()

    // Debug logging
    console.log('[ViewHeader] board:', board)
    console.log('[ViewHeader] board.isFavorite:', board?.isFavorite)

    // Early return if board data is not loaded yet
    if (!board) {
        return null
    }

    // Filter views by visibility
    const filteredViews = useFilteredViews(views, currentUserId)

    const filterGroup: FilterGroup = activeView?.fields?.filter || {operation: 'and', filters: []}
    const activeFilterCount = filterGroup.filters?.length || 0

    const handleFilterChange = useCallback((newFilterGroup: FilterGroup) => {
        if (!activeView) return
        patchBlock.mutate({
            blockId: activeView.id,
            patch: {
                fields: {
                    ...activeView.fields,
                    filter: newFilterGroup,
                },
            },
        })
    }, [activeView, patchBlock])

    const handleNewCard = () => {
        // Default new card to the first option of the groupBy property
        const properties: Record<string, string> = {}
        const groupByPropId = activeView?.fields?.groupById
        if (groupByPropId) {
            const groupByProp = board.cardProperties?.find((p) => p.id === groupByPropId)
            if (groupByProp?.options?.length) {
                properties[groupByPropId] = groupByProp.options[0].id
            }
        }
        const newCard: any = {
            boardId: board.id,
            parentId: board.id,
            type: 'card',
            title: '',
            fields: {
                properties,
                contentOrder: [],
            },
            schema: 1,
        }
        insertBlocks.mutate([newCard])
    }

    const handleSaveView = (viewName: string, visibility: ViewVisibility) => {
        if (!activeView) return

        const newView: any = {
            boardId: board.id,
            parentId: board.id,
            type: 'view',
            title: viewName,
            fields: {
                ...activeView.fields,
                visibility,
                isReadOnly: visibility === 'template',
            },
            schema: 1,
        }

        insertBlocks.mutate([newView])
    }

    return (
        <>
            <div className="flex items-center gap-1 px-6 pb-2 border-b border-border-default">
                {/* View tabs */}
                <div className="flex items-center gap-0.5 mr-4">
                    {filteredViews.map((view) => {
                        const viewType = view.fields?.viewType || 'board'
                        const visibility = view.fields?.visibility || 'team'
                        const Icon = viewTypeIcons[viewType] || LayoutGrid
                        const isActive = view.id === activeView?.id
                        const isDefault = board.defaultViewId === view.id

                        return (
                            <button
                                key={view.id}
                                onClick={() => onViewChange(view.id)}
                                className={cn(
                                    'flex items-center gap-1.5 h-8 px-3 rounded text-sm transition-colors cursor-pointer',
                                    isActive
                                        ? 'bg-button-bg/10 text-button-bg font-medium'
                                        : 'text-center-fg/60 hover:text-center-fg hover:bg-hover'
                                )}
                            >
                                <Icon size={14} />
                                <span>{view.title || viewTypeLabels[viewType]}</span>
                                {visibility === 'personal' && (
                                    <User size={10} className="opacity-50" title="Personal view" />
                                )}
                                {visibility === 'template' && (
                                    <Lock size={10} className="opacity-50" title="Template view" />
                                )}
                                {isDefault && (
                                    <Star size={10} className="text-yellow-500" title="Default view" />
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* Favorite button */}
                <button
                    onClick={() => {
                        console.log('[ViewHeader] Toggling favorite for board:', board.id)
                        toggleFavorite.mutate({boardId: board.id})
                    }}
                    className={cn(
                        'flex items-center justify-center h-8 w-8 rounded transition-colors cursor-pointer mr-2',
                        board.isFavorite
                            ? 'text-yellow-400 hover:bg-yellow-400/10'
                            : 'text-center-fg/30 hover:text-center-fg/60 hover:bg-hover'
                    )}
                    title={board.isFavorite ? "Remove from favorites" : "Add to favorites"}
                    data-testid="favorite-button"
                >
                    <Star size={16} fill={board.isFavorite ? "currentColor" : "none"} />
                </button>

                {/* Filter button */}
                <div className="relative">
                    <button
                        onClick={() => setShowFilter(!showFilter)}
                        className={cn(
                            'flex items-center gap-1.5 h-8 px-2.5 rounded text-sm transition-colors cursor-pointer',
                            activeFilterCount > 0
                                ? 'bg-button-bg/10 text-button-bg font-medium'
                                : 'text-center-fg/50 hover:text-center-fg hover:bg-hover',
                        )}
                        title="Filter"
                    >
                        <Filter size={14} />
                        {activeFilterCount > 0 && (
                            <span className="text-xs">{activeFilterCount}</span>
                        )}
                    </button>

                    <FilterComponent
                        open={showFilter}
                        onClose={() => setShowFilter(false)}
                        properties={board.cardProperties || []}
                        filterGroup={filterGroup}
                        onChange={handleFilterChange}
                    />
                </div>

                {/* Save View button */}
                <button
                    onClick={() => setShowSaveViewDialog(true)}
                    className="flex items-center gap-1.5 h-8 px-2.5 rounded text-sm text-center-fg/70 hover:text-center-fg hover:bg-hover transition-colors cursor-pointer"
                    title="Save current view"
                    data-tour-target={isOnboardingBoard ? 'add-view-button' : undefined}
                >
                    <Save size={16} />
                </button>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Share button */}
                <button
                    onClick={() => setShowShareDialog(true)}
                    className="flex items-center gap-1.5 h-8 px-2 rounded text-center-fg/50 hover:text-center-fg hover:bg-hover text-sm transition-colors cursor-pointer"
                    title="Share"
                    data-tour-target={isOnboardingBoard ? 'share-button' : undefined}
                >
                    <Share2 size={14} />
                </button>

                {/* Members button */}
                <button
                    onClick={() => setShowMembersDialog(true)}
                    className="flex items-center gap-1.5 h-8 px-2 rounded text-center-fg/50 hover:text-center-fg hover:bg-hover text-sm transition-colors cursor-pointer"
                    title="Members"
                >
                    <Users size={14} />
                </button>

                {/* New card button */}
                <button
                    onClick={handleNewCard}
                    disabled={insertBlocks.isPending}
                    className="flex items-center gap-1.5 h-8 px-3 rounded bg-button-bg text-button-fg text-sm font-semibold hover:bg-button-hover transition-colors cursor-pointer disabled:opacity-50"
                >
                    <Plus size={14} />
                    <span>New</span>
                </button>
            </div>

            {/* Dialogs */}
            <ShareBoardDialog
                open={showShareDialog}
                onClose={() => setShowShareDialog(false)}
                boardId={board.id}
            />
            <MembersDialog
                open={showMembersDialog}
                onClose={() => setShowMembersDialog(false)}
                boardId={board.id}
            />
            {activeView && (
                <SaveViewDialog
                    open={showSaveViewDialog}
                    onClose={() => setShowSaveViewDialog(false)}
                    board={board}
                    currentView={activeView}
                    onSave={handleSaveView}
                />
            )}
        </>
    )
}
