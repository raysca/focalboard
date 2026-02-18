import React, {useState} from 'react'
import {Link} from '@tanstack/react-router'
import {Star, MoreHorizontal, Hash, Clock} from 'lucide-react'
import {cn} from '../../lib/cn'
import type {Board} from '../../api/types'
import {BoardContextMenu} from './BoardContextMenu'

interface BoardCardProps {
    board: Board
    onStar: (boardId: string) => void
    onCopy: (boardId: string) => void
    onDelete: (boardId: string) => void
}

export function BoardCard({board, onStar, onCopy, onDelete}: BoardCardProps) {
    const [menuAnchor, setMenuAnchor] = useState<DOMRect | null>(null)

    const lastActivity = board.updateAt
        ? new Date(board.updateAt).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})
        : null

    return (
        <div
            className="group relative flex flex-col bg-white border border-black/5 rounded-[var(--radius-default)] shadow-sm hover:shadow-md hover:border-black/10 transition-all duration-200"
            data-testid="board-card"
        >
            {/* Star button */}
            <button
                onClick={(e) => { e.preventDefault(); onStar(board.id) }}
                aria-label={board.isFavorite ? 'Unstar board' : 'Star board'}
                data-testid="board-star-button"
                className={cn(
                    'absolute top-3 right-8 p-1 rounded transition-colors opacity-0 group-hover:opacity-100',
                    board.isFavorite ? 'opacity-100 text-yellow-500' : 'text-center-fg/30 hover:text-yellow-500'
                )}
            >
                <Star size={14} fill={board.isFavorite ? 'currentColor' : 'none'} />
            </button>

            {/* Menu button */}
            <button
                onClick={(e) => {
                    e.preventDefault()
                    setMenuAnchor(e.currentTarget.getBoundingClientRect())
                }}
                aria-label="Board options"
                data-testid="board-menu-button"
                className="absolute top-3 right-2 p-1 rounded text-center-fg/30 hover:text-center-fg hover:bg-black/5 transition-colors opacity-0 group-hover:opacity-100"
            >
                <MoreHorizontal size={14} />
            </button>

            {/* Card content - clickable link */}
            <Link
                to="/board/$boardId"
                params={{boardId: board.id}}
                className="flex flex-col p-5 h-full no-underline"
                data-testid="board-card-link"
            >
                <div className="mb-3">
                    <span className="text-2xl">{board.icon || '📋'}</span>
                </div>
                <h3 className="font-medium text-base text-center-fg group-hover:text-blue-600 transition-colors mb-1 truncate pr-12">
                    {board.title}
                </h3>
                <p className="text-xs text-center-fg/50 line-clamp-2 mb-3 flex-1">
                    {board.description || 'No description'}
                </p>
                <div className="flex items-center gap-3 text-xs text-center-fg/40 mt-auto">
                    {board.cardCount !== undefined && (
                        <span className="flex items-center gap-1" data-testid="board-card-count">
                            <Hash size={11} />
                            {board.cardCount} {board.cardCount === 1 ? 'card' : 'cards'}
                        </span>
                    )}
                    {lastActivity && (
                        <span className="flex items-center gap-1">
                            <Clock size={11} />
                            {lastActivity}
                        </span>
                    )}
                </div>
            </Link>

            {menuAnchor && (
                <BoardContextMenu
                    board={board}
                    anchorRect={menuAnchor}
                    onClose={() => setMenuAnchor(null)}
                    onStar={() => onStar(board.id)}
                    onCopy={() => onCopy(board.id)}
                    onDelete={() => onDelete(board.id)}
                />
            )}
        </div>
    )
}
