import React, {useState, useCallback} from 'react'
import {Plus, LayoutGrid, Table, Image, Calendar, Share2, Users, Filter} from 'lucide-react'
import {cn} from '../../lib/cn'
import {useInsertBlocksMutation, usePatchBlockMutation} from '../../hooks/useBlocks'
import {ShareBoardDialog} from '../board/ShareBoardDialog'
import {MembersDialog} from '../board/MembersDialog'
import {FilterComponent} from './FilterComponent'
import type {Board, BoardView, Card, FilterGroup} from '../../api/types'

interface ViewHeaderProps {
    board: Board
    views: BoardView[]
    activeView?: BoardView
    onViewChange: (viewId: string) => void
    cards: Card[]
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

export function ViewHeader({board, views, activeView, onViewChange, cards}: ViewHeaderProps) {
    const insertBlocks = useInsertBlocksMutation(board.id)
    const patchBlock = usePatchBlockMutation(board.id)
    const [showShareDialog, setShowShareDialog] = useState(false)
    const [showMembersDialog, setShowMembersDialog] = useState(false)
    const [showFilter, setShowFilter] = useState(false)

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

    return (
        <>
            <div className="flex items-center gap-1 px-6 pb-2 border-b border-border-default">
                {/* View tabs */}
                <div className="flex items-center gap-0.5 mr-4">
                    {views.map((view) => {
                        const viewType = view.fields?.viewType || 'board'
                        const Icon = viewTypeIcons[viewType] || LayoutGrid
                        const isActive = view.id === activeView?.id

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
                            </button>
                        )
                    })}
                </div>

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

                {/* Spacer */}
                <div className="flex-1" />

                {/* Share button */}
                <button
                    onClick={() => setShowShareDialog(true)}
                    className="flex items-center gap-1.5 h-8 px-2 rounded text-center-fg/50 hover:text-center-fg hover:bg-hover text-sm transition-colors cursor-pointer"
                    title="Share"
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
        </>
    )
}
