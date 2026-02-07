import React, {useState} from 'react'
import {ChevronDown, ChevronRight} from 'lucide-react'
import type {Board, Category} from '../../api/types'
import {SidebarBoardItem} from './SidebarBoardItem'

interface SidebarCategoryProps {
    category: Category
    boards: Board[]
    activeBoardId?: string
}

export function SidebarCategory({category, boards, activeBoardId}: SidebarCategoryProps) {
    const [collapsed, setCollapsed] = useState(category.collapsed || false)

    return (
        <div className="mb-1">
            {/* Category header */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="flex items-center w-full h-7 px-4 text-[11px] font-semibold uppercase tracking-wider text-sidebar-text-secondary hover:text-sidebar-fg transition-colors cursor-pointer"
            >
                {collapsed ? <ChevronRight size={12} className="mr-1" /> : <ChevronDown size={12} className="mr-1" />}
                <span className="truncate">{category.name}</span>
                <span className="ml-auto text-[10px] opacity-60">{boards.length}</span>
            </button>

            {/* Board list */}
            {!collapsed && (
                <div>
                    {boards.map((board) => (
                        <SidebarBoardItem
                            key={board.id}
                            board={board}
                            isActive={board.id === activeBoardId}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
