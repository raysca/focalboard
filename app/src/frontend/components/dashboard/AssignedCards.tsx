import React from 'react'
import {Link} from '@tanstack/react-router'
import {CheckCircle2, Circle, Target} from 'lucide-react'
import type {Block, Board} from '../../api/types'

interface AssignedCardsProps {
    cards: Block[]
    boards: Board[]
    userId: string
}

export function AssignedCards({cards, boards, userId}: AssignedCardsProps) {
    const assignedCards = cards.filter((card) => {
        if (card.type !== 'card' || card.deleteAt !== 0) return false
        const assignee =
            card.fields?.properties?.['prop-assignee'] ||
            card.fields?.properties?.Assignee ||
            card.fields?.properties?.assignee
        return assignee === userId || (Array.isArray(assignee) && assignee.includes(userId))
    })

    const sortedCards = assignedCards
        .sort((a, b) => {
            // Sort by completion status, then by due date
            const aStatus = getCardStatus(a)
            const bStatus = getCardStatus(b)
            if (aStatus !== bStatus) return aStatus === 'done' ? 1 : -1

            const aDue = getCardDueDate(a)
            const bDue = getCardDueDate(b)
            if (!aDue) return 1
            if (!bDue) return -1
            return aDue - bDue
        })
        .slice(0, 8) // Show top 8 cards

    if (assignedCards.length === 0) {
        return (
            <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 opacity-70" />
                    <h2 className="text-xl font-semibold text-center-fg">My Assigned Cards</h2>
                </div>
                <div className="bg-white border border-border-default rounded-[var(--radius-default)] p-8 text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Target className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-medium text-center-fg mb-2">No cards assigned yet</h3>
                    <p className="text-center-fg/60 max-w-md mx-auto">
                        Cards assigned to you will appear here for easy access.
                    </p>
                </div>
            </section>
        )
    }

    return (
        <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 opacity-70" />
                    <h2 className="text-xl font-semibold text-center-fg">My Assigned Cards</h2>
                    <span className="text-sm font-medium px-2 py-0.5 bg-button-bg/10 text-button-bg rounded-full">
                        {assignedCards.length}
                    </span>
                </div>
            </div>
            <div className="bg-white border border-border-default rounded-[var(--radius-default)] divide-y divide-border-default">
                {sortedCards.map((card) => {
                    const board = boards.find((b) => b.id === card.boardId)
                    const status = getCardStatus(card)
                    const dueDate = getCardDueDate(card)
                    const isOverdue = dueDate && dueDate < Date.now()

                    return (
                        <Link
                            key={card.id}
                            to="/board/$boardId"
                            params={{boardId: card.boardId}}
                            className="flex items-center gap-4 p-4 hover:bg-hover transition-colors group"
                        >
                            {/* Status Icon */}
                            {status === 'done' ? (
                                <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                            ) : (
                                <Circle className="w-5 h-5 text-center-fg/30 flex-shrink-0" />
                            )}

                            {/* Card Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start gap-2 mb-1">
                                    {card.fields?.icon && <span className="text-sm flex-shrink-0">{card.fields.icon}</span>}
                                    <span
                                        className={`font-medium text-sm group-hover:text-button-bg transition-colors truncate ${
                                            status === 'done' ? 'line-through text-center-fg/50' : 'text-center-fg'
                                        }`}
                                    >
                                        {card.title || 'Untitled'}
                                    </span>
                                </div>
                                {board && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-center-fg/50">
                                            {board.icon} {board.title}
                                        </span>
                                        {dueDate && (
                                            <>
                                                <span className="text-center-fg/20">•</span>
                                                <span
                                                    className={`text-xs font-medium ${
                                                        isOverdue ? 'text-error' : 'text-center-fg/50'
                                                    }`}
                                                >
                                                    {isOverdue ? 'Overdue' : formatDueDate(dueDate)}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </Link>
                    )
                })}
            </div>
            {assignedCards.length > 8 && (
                <div className="text-center mt-3">
                    <span className="text-sm text-center-fg/60">
                        Showing 8 of {assignedCards.length} assigned cards
                    </span>
                </div>
            )}
        </section>
    )
}

function getCardStatus(card: Block): string {
    const status = card.fields?.properties?.['prop-status'] || card.fields?.properties?.Status || ''
    const statusStr = String(status).toLowerCase()
    if (
        statusStr.includes('done') ||
        statusStr.includes('complete') ||
        statusStr.includes('deployed') ||
        statusStr === 'status-done'
    ) {
        return 'done'
    }
    return 'pending'
}

function getCardDueDate(card: Block): number | null {
    const dueDate =
        card.fields?.properties?.['prop-due-date'] ||
        card.fields?.properties?.['Due Date'] ||
        card.fields?.properties?.dueDate
    if (!dueDate) return null
    return typeof dueDate === 'number' ? dueDate : new Date(dueDate).getTime()
}

function formatDueDate(timestamp: number): string {
    const now = Date.now()
    const diff = timestamp - now
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'Due today'
    if (days === 1) return 'Due tomorrow'
    if (days < 7) return `Due in ${days} days`
    return new Date(timestamp).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})
}
