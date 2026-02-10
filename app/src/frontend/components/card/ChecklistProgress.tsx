import React from 'react'
import {CheckSquare} from 'lucide-react'
import {cn} from '../../lib/cn'

interface ChecklistProgressProps {
    completed: number
    total: number
    className?: string
}

export function ChecklistProgress({completed, total, className}: ChecklistProgressProps) {
    if (total === 0) return null

    const percentage = Math.round((completed / total) * 100)

    return (
        <div className={cn('flex items-center gap-3 py-2', className)}>
            <div className="flex items-center gap-1.5 text-xs text-center-fg/60">
                <CheckSquare size={14} />
                <span className="font-medium">
                    {completed}/{total}
                </span>
            </div>
            <div className="flex-1 h-2 bg-center-fg/10 rounded-full overflow-hidden">
                <div
                    className="h-full bg-button-bg transition-all duration-300"
                    style={{width: `${percentage}%`}}
                />
            </div>
            <span className="text-xs text-center-fg/40">
                {percentage}%
            </span>
        </div>
    )
}
