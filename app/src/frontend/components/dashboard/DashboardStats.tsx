import React from 'react'
import {BarChart3, CheckCircle2, Clock, ListTodo} from 'lucide-react'
import type {Board, Block} from '../../api/types'

interface DashboardStatsProps {
    boards: Board[]
    cards?: Block[]
}

export function DashboardStats({boards, cards = []}: DashboardStatsProps) {
    const totalCards = cards.filter((c) => c.type === 'card' && c.deleteAt === 0).length
    const completedThisWeek = getCompletedThisWeek(cards)
    const dueThisWeek = getDueThisWeek(cards)

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
                icon={<BarChart3 className="w-5 h-5" />}
                label="Active Boards"
                value={boards.length}
                color="blue"
            />
            <StatCard
                icon={<ListTodo className="w-5 h-5" />}
                label="Total Cards"
                value={totalCards}
                color="purple"
            />
            <StatCard
                icon={<CheckCircle2 className="w-5 h-5" />}
                label="Completed This Week"
                value={completedThisWeek}
                color="green"
            />
            <StatCard
                icon={<Clock className="w-5 h-5" />}
                label="Due This Week"
                value={dueThisWeek}
                color="orange"
            />
        </div>
    )
}

interface StatCardProps {
    icon: React.ReactNode
    label: string
    value: number
    color: 'blue' | 'purple' | 'green' | 'orange'
}

function StatCard({icon, label, value, color}: StatCardProps) {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600',
        purple: 'bg-purple-50 text-purple-600',
        green: 'bg-green-50 text-green-600',
        orange: 'bg-orange-50 text-orange-600',
    }

    return (
        <div className="bg-white border border-border-default rounded-[var(--radius-default)] p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-[var(--radius-default)] ${colorClasses[color]}`}>{icon}</div>
                <div className="flex-1">
                    <div className="text-2xl font-bold text-center-fg">{value}</div>
                </div>
            </div>
            <div className="text-xs font-medium text-center-fg/60 uppercase tracking-wide">{label}</div>
        </div>
    )
}

function getCompletedThisWeek(cards: Block[]): number {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    return cards.filter((card) => {
        if (card.type !== 'card' || card.deleteAt !== 0) return false
        const status = card.fields?.properties?.['prop-status'] || card.fields?.properties?.Status
        const isDone =
            status === 'status-done' ||
            status === 'status-complete' ||
            status === 'Done' ||
            status === 'Complete' ||
            status === 'Deployed'
        const updatedRecently = card.updateAt >= oneWeekAgo
        return isDone && updatedRecently
    }).length
}

function getDueThisWeek(cards: Block[]): number {
    const now = Date.now()
    const oneWeekFromNow = now + 7 * 24 * 60 * 60 * 1000
    return cards.filter((card) => {
        if (card.type !== 'card' || card.deleteAt !== 0) return false
        const dueDate =
            card.fields?.properties?.['prop-due-date'] ||
            card.fields?.properties?.['Due Date'] ||
            card.fields?.properties?.dueDate
        if (!dueDate) return false
        const dueDateNum = typeof dueDate === 'number' ? dueDate : new Date(dueDate).getTime()
        return dueDateNum >= now && dueDateNum <= oneWeekFromNow
    }).length
}
