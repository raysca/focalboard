import React from 'react'
import {Plus} from 'lucide-react'
import type {Board} from '../../api/types'
import {BoardCard} from './BoardCard'
import {BoardListRow} from './BoardListRow'

interface BoardListSectionProps {
    title: string
    boards: Board[]
    layout: 'grid' | 'list'
    onStar: (boardId: string) => void
    onCopy: (boardId: string) => void
    onDelete: (boardId: string) => void
    showCreateButton?: boolean
    onCreateClick?: () => void
    testId?: string
}

export function BoardListSection({
    title, boards, layout, onStar, onCopy, onDelete,
    showCreateButton, onCreateClick, testId,
}: BoardListSectionProps) {
    if (boards.length === 0 && !showCreateButton) return null

    return (
        <section className="mb-8" data-testid={testId}>
            <h2 className="text-sm font-semibold text-center-fg/50 uppercase tracking-wide mb-3 px-1">
                {title}
            </h2>

            {layout === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {boards.map(board => (
                        <BoardCard
                            key={board.id}
                            board={board}
                            onStar={onStar}
                            onCopy={onCopy}
                            onDelete={onDelete}
                        />
                    ))}
                    {showCreateButton && (
                        <button
                            onClick={onCreateClick}
                            data-testid="create-board-card"
                            className="flex flex-col items-center justify-center p-5 rounded-[var(--radius-default)] border border-dashed border-black/20 hover:border-blue-500/50 hover:bg-blue-50/50 transition-all duration-200 group min-h-[140px]"
                        >
                            <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center mb-3 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                <Plus size={20} />
                            </div>
                            <span className="font-medium text-center-fg/70 group-hover:text-blue-600 text-sm">
                                Create New Board
                            </span>
                        </button>
                    )}
                </div>
            ) : (
                <div className="bg-white border border-black/5 rounded-[var(--radius-default)] overflow-hidden">
                    {/* List header */}
                    <div className="flex items-center px-4 py-2 bg-black/[0.02] border-b border-black/5 text-xs text-center-fg/40 font-medium">
                        <span className="flex-1">Board</span>
                        <span className="w-20 text-right">Cards</span>
                        <span className="w-24 text-right hidden sm:block">Last activity</span>
                        <span className="w-16" />
                    </div>
                    {boards.map(board => (
                        <BoardListRow
                            key={board.id}
                            board={board}
                            onStar={onStar}
                            onCopy={onCopy}
                            onDelete={onDelete}
                        />
                    ))}
                    {showCreateButton && (
                        <button
                            onClick={onCreateClick}
                            data-testid="create-board-card"
                            className="flex items-center gap-2 w-full px-4 py-3 text-sm text-center-fg/50 hover:text-blue-600 hover:bg-blue-50/50 transition-colors border-t border-black/5"
                        >
                            <Plus size={14} />
                            Create New Board
                        </button>
                    )}
                </div>
            )}
        </section>
    )
}
