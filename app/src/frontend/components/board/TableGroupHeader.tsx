import React from 'react'
import {Plus} from 'lucide-react'

interface TableGroupHeaderProps {
    groupName: string
    groupId: string
    itemCount: number
    colSpan: number
    onAddCard: () => void
}

export function TableGroupHeader({groupName, groupId, itemCount, colSpan, onAddCard}: TableGroupHeaderProps) {
    return (
        <tr className="border-b border-border-default bg-hover/30">
            <td colSpan={colSpan} className="py-2 px-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-center-fg/70">
                            {groupName}
                        </span>
                        <span className="text-xs text-center-fg/40">
                            {itemCount}
                        </span>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onAddCard()
                        }}
                        className="flex items-center gap-1 text-xs text-center-fg/50 hover:text-center-fg transition-colors"
                    >
                        <Plus size={14} />
                        <span>Add</span>
                    </button>
                </div>
            </td>
        </tr>
    )
}
