import React, {useState} from 'react'
import {Link, useNavigate} from '@tanstack/react-router'
import {MoreHorizontal, Trash2} from 'lucide-react'
import {cn} from '../../lib/cn'
import {useDeleteBoardMutation} from '../../hooks/useBoards'
import {DEFAULT_TEAM_ID} from '../../lib/constants'
import type {Board} from '../../api/types'

interface SidebarBoardItemProps {
    board: Board
    isActive: boolean
}

export function SidebarBoardItem({board, isActive}: SidebarBoardItemProps) {
    const [showMenu, setShowMenu] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const navigate = useNavigate()
    const deleteBoard = useDeleteBoardMutation(DEFAULT_TEAM_ID)

    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (!confirmDelete) {
            setConfirmDelete(true)
            return
        }
        deleteBoard.mutate(board.id, {
            onSuccess: () => {
                setShowMenu(false)
                setConfirmDelete(false)
                if (isActive) {
                    navigate({to: '/dashboard'})
                }
            },
        })
    }

    const handleMenuToggle = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setShowMenu((prev) => !prev)
        setConfirmDelete(false)
    }

    return (
        <div className="relative group">
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
                <span className="text-sm truncate flex-1">{board.title || 'Untitled'}</span>

                {/* Menu trigger (visible on hover) */}
                <button
                    onClick={handleMenuToggle}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/20 transition-all shrink-0 cursor-pointer"
                >
                    <MoreHorizontal size={14} />
                </button>
            </Link>

            {/* Dropdown menu */}
            {showMenu && (
                <>
                    <div className="fixed inset-0 z-50" onClick={() => {setShowMenu(false); setConfirmDelete(false)}} />
                    <div className="absolute right-2 top-8 z-50 bg-center-bg border border-border-default rounded-[var(--radius-default)] shadow-elevation-3 py-1 min-w-[140px]">
                        <button
                            onClick={handleDelete}
                            className={cn(
                                'flex items-center gap-2 w-full px-3 py-1.5 text-xs transition-colors cursor-pointer',
                                confirmDelete
                                    ? 'text-red-500 bg-red-500/10 hover:bg-red-500/20 font-medium'
                                    : 'text-center-fg/70 hover:bg-hover hover:text-center-fg'
                            )}
                        >
                            <Trash2 size={13} />
                            <span>{confirmDelete ? 'Click to confirm' : 'Delete board'}</span>
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}
