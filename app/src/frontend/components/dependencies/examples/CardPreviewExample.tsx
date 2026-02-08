/**
 * Example: How to add DependencyBadge to card previews
 *
 * This file shows how to add dependency indicators to your card preview components
 * in Kanban, Table, Gallery, and Calendar views.
 */

import { DependencyBadge } from '../DependencyBadge'

interface CardPreviewProps {
    cardId: string
    title: string
    status?: string
    assignee?: string
}

/**
 * Kanban Card Preview with Dependency Badge
 */
export function KanbanCardPreview({ cardId, title, status, assignee }: CardPreviewProps) {
    return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            {/* Card Title */}
            <div className="font-medium text-sm mb-2">{title}</div>

            {/* 🎯 DEPENDENCY BADGE - Compact variant for Kanban cards */}
            <div className="flex items-center justify-between">
                <DependencyBadge cardId={cardId} variant="compact" />

                {/* Other metadata */}
                <div className="flex items-center gap-2">
                    {assignee && (
                        <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">
                            {assignee.charAt(0)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

/**
 * Table Row with Dependency Badge
 */
export function TableRowExample({ cardId, title, status, assignee }: CardPreviewProps) {
    return (
        <tr className="border-b hover:bg-gray-50">
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    {/* 🎯 DEPENDENCY BADGE - Compact for table rows */}
                    <DependencyBadge cardId={cardId} variant="compact" />
                    <span className="font-medium text-sm">{title}</span>
                </div>
            </td>
            <td className="px-4 py-3 text-sm">{status}</td>
            <td className="px-4 py-3 text-sm">{assignee}</td>
        </tr>
    )
}

/**
 * Gallery Card with Full Badge
 */
export function GalleryCardExample({ cardId, title }: CardPreviewProps) {
    return (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            {/* Card Image */}
            <div className="h-40 bg-gradient-to-br from-blue-400 to-purple-500" />

            {/* Card Content */}
            <div className="p-4">
                <h3 className="font-semibold mb-2">{title}</h3>

                {/* 🎯 DEPENDENCY BADGE - Full variant for gallery cards */}
                <DependencyBadge cardId={cardId} variant="full" />
            </div>
        </div>
    )
}

/**
 * Calendar Event with Badge
 */
export function CalendarEventExample({ cardId, title }: CardPreviewProps) {
    return (
        <div className="bg-blue-500 text-white rounded px-2 py-1 text-xs cursor-pointer hover:bg-blue-600 transition-colors">
            <div className="flex items-center gap-1">
                {/* 🎯 DEPENDENCY BADGE - Compact for calendar events */}
                <DependencyBadge cardId={cardId} variant="compact" />
                <span className="truncate">{title}</span>
            </div>
        </div>
    )
}

/**
 * Card Hover Tooltip with Full Details
 */
export function CardTooltipExample({ cardId, title }: CardPreviewProps) {
    return (
        <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm">
            <h3 className="font-semibold mb-3">{title}</h3>

            {/* 🎯 DEPENDENCY BADGE - Full variant for tooltips */}
            <div className="mb-2">
                <div className="text-xs font-medium text-gray-500 mb-1">Dependencies:</div>
                <DependencyBadge cardId={cardId} variant="full" />
            </div>

            <div className="text-sm text-gray-600 mt-2">
                Click to view full card details
            </div>
        </div>
    )
}
