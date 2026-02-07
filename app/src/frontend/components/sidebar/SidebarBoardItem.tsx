import React from 'react'
import {Link} from '@tanstack/react-router'
import {cn} from '../../lib/cn'
import type {Board} from '../../api/types'

interface SidebarBoardItemProps {
    board: Board
    isActive: boolean
}

export function SidebarBoardItem({board, isActive}: SidebarBoardItemProps) {
    return (
        <Link
            to="/board/$boardId"
            params={{boardId: board.id}}
            className={cn(
                'flex items-center h-8 px-5 mr-2 rounded-r-[20px] cursor-pointer transition-colors no-underline',
                'text-sidebar-fg/80 hover:bg-white/10 hover:text-sidebar-fg',
                isActive && 'bg-white/20 text-sidebar-fg font-medium'
            )}
        >
            {board.icon ? (
                <span className="mr-2 text-sm shrink-0">{board.icon}</span>
            ) : (
                <span className="w-5 h-5 mr-2 rounded bg-white/20 flex items-center justify-center text-[10px] font-bold shrink-0">
                    {board.title?.[0]?.toUpperCase() || 'B'}
                </span>
            )}
            <span className="text-sm truncate">{board.title || 'Untitled'}</span>
        </Link>
    )
}
