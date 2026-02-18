import React, {useState} from 'react'
import {Link} from '@tanstack/react-router'
import {Star, MoreHorizontal, Hash} from 'lucide-react'
import {cn} from '../../lib/cn'
import type {Board} from '../../api/types'
import {BoardContextMenu} from './BoardContextMenu'

interface BoardListRowProps {
    board: Board
    onStar: (boardId: string) => void
    onCopy: (boardId: string) => void
    onDelete: (boardId: string) => void
}

export function BoardListRow({board, onStar, onCopy, onDelete}: BoardListRowProps) {
    const [menuAnchor, setMenuAnchor] = useState<DOMRect | null>(null)

    const lastActivity = board.updateAt
        ? new Date(board.updateAt).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})
        : '—'

    return (
        <div
            className="group flex items-center bg-white border-b border-black/5 last:border-b-0 hover:bg-black/[0.02] transition-colors"
            data-testid="board-list-row"
        >
            <Link
                to="/board/$boardId"
                params={{boardId: board.id}}
                className="flex items-center flex-1 px-4 py-3 gap-3 no-underline min-w-0"
            >
                <span className="text-lg shrink-0">{board.icon || '📋'}</span>
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-center-fg truncate group-hover:text-blue-600 transition-colors">
                        {board.title}
                    </p>
                    <p className="text-xs text-center-fg/40 truncate">
                        {board.description || 'No description'}
                    </p>
                </div>
                <span className="shrink-0 text-xs text-center-fg/40 flex items-center gap-1 w-20 justify-end" data-testid="board-card-count">
                    <Hash size={11} />
                    {board.cardCount ?? 0}
                </span>
                <span className="shrink-0 text-xs text-center-fg/40 w-24 text-right hidden sm:block">
                    {lastActivity}
                </span>
            </Link>

            <div className="flex items-center gap-1 pr-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => onStar(board.id)}
                    aria-label={board.isFavorite ? 'Unstar board' : 'Star board'}
                    data-testid="board-star-button"
                    className={cn(
                        'p-1 rounded transition-colors',
                        board.isFavorite ? 'text-yellow-500' : 'text-center-fg/30 hover:text-yellow-500'
                    )}
                >
                    <Star size={14} fill={board.isFavorite ? 'currentColor' : 'none'} />
                </button>
                <button
                    onClick={(e) => setMenuAnchor(e.currentTarget.getBoundingClientRect())}
                    aria-label="Board options"
                    data-testid="board-menu-button"
                    className="p-1 rounded text-center-fg/30 hover:text-center-fg hover:bg-black/5 transition-colors"
                >
                    <MoreHorizontal size={14} />
                </button>
            </div>

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
