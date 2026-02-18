import React, {useRef, useEffect} from 'react'
import {useNavigate} from '@tanstack/react-router'
import {ExternalLink, Star, StarOff, Copy, Settings, Trash2} from 'lucide-react'
import {cn} from '../../lib/cn'
import type {Board} from '../../api/types'

interface BoardContextMenuProps {
    board: Board
    anchorRect: DOMRect
    onClose: () => void
    onStar: () => void
    onCopy: () => void
    onDelete: () => void
}

export function BoardContextMenu({board, anchorRect, onClose, onStar, onCopy, onDelete}: BoardContextMenuProps) {
    const navigate = useNavigate()
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose()
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [onClose])

    const menuStyle: React.CSSProperties = {
        position: 'fixed',
        top: anchorRect.bottom + 4,
        left: anchorRect.left,
        zIndex: 50,
    }

    const items = [
        {
            icon: <ExternalLink size={14} />,
            label: 'Open board',
            onClick: () => { navigate({to: '/board/$boardId', params: {boardId: board.id}}); onClose() },
            testId: 'context-menu-open',
        },
        {
            icon: board.isFavorite ? <StarOff size={14} /> : <Star size={14} />,
            label: board.isFavorite ? 'Unstar' : 'Star',
            onClick: () => { onStar(); onClose() },
            testId: 'context-menu-star',
        },
        {
            icon: <Copy size={14} />,
            label: 'Copy board',
            onClick: () => { onCopy(); onClose() },
            testId: 'context-menu-copy',
        },
        {
            icon: <Settings size={14} />,
            label: 'Board settings',
            onClick: () => { navigate({to: '/board/$boardId', params: {boardId: board.id}}); onClose() },
            testId: 'context-menu-settings',
        },
        {
            icon: <Trash2 size={14} />,
            label: 'Delete board',
            onClick: () => { onDelete(); onClose() },
            testId: 'context-menu-delete',
            danger: true,
        },
    ]

    return (
        <div
            ref={menuRef}
            style={menuStyle}
            className="bg-white border border-black/10 rounded-[var(--radius-default)] shadow-lg py-1 min-w-[180px]"
            data-testid="board-context-menu"
        >
            {items.map(item => (
                <button
                    key={item.label}
                    onClick={item.onClick}
                    data-testid={item.testId}
                    className={cn(
                        'flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors',
                        item.danger
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-center-fg hover:bg-black/5'
                    )}
                >
                    <span className="opacity-60">{item.icon}</span>
                    {item.label}
                </button>
            ))}
        </div>
    )
}
