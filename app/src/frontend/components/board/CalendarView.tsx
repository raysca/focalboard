import React, {useMemo, useState} from 'react'
import {useNavigate} from '@tanstack/react-router'
import {ChevronLeft, ChevronRight} from 'lucide-react'
import type {Board, BoardView, Card} from '../../api/types'

interface CalendarViewProps {
    board: Board
    cards: Card[]
    activeView?: BoardView
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function CalendarView({board, cards, activeView}: CalendarViewProps) {
    const navigate = useNavigate()
    const [currentDate, setCurrentDate] = useState(new Date())

    const dateDisplayPropId = activeView?.fields?.dateDisplayPropertyId
    const dateProp = board.cardProperties?.find((p) => p.id === dateDisplayPropId)

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const calendarDays = useMemo(() => {
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const startPad = firstDay.getDay()
        const totalDays = lastDay.getDate()

        const days: {date: number; isCurrentMonth: boolean; cards: Card[]}[] = []

        // Padding from previous month
        const prevMonthLast = new Date(year, month, 0).getDate()
        for (let i = startPad - 1; i >= 0; i--) {
            days.push({date: prevMonthLast - i, isCurrentMonth: false, cards: []})
        }

        // Current month days
        for (let d = 1; d <= totalDays; d++) {
            const dayCards = dateProp
                ? cards.filter((card) => {
                    try {
                        const val = card.fields?.properties?.[dateProp.id]
                        if (!val) return false
                        const parsed = JSON.parse(val)
                        const from = new Date(parsed.from)
                        return from.getFullYear() === year && from.getMonth() === month && from.getDate() === d
                    } catch {
                        return false
                    }
                })
                : []
            days.push({date: d, isCurrentMonth: true, cards: dayCards})
        }

        // Padding for next month
        const remaining = 42 - days.length
        for (let i = 1; i <= remaining; i++) {
            days.push({date: i, isCurrentMonth: false, cards: []})
        }

        return days
    }, [year, month, cards, dateProp])

    const handleCardClick = (card: Card) => {
        navigate({
            to: '/board/$boardId/$viewId/$cardId',
            params: {
                boardId: board.id,
                viewId: activeView?.id || '_',
                cardId: card.id,
            },
        })
    }

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
    const today = () => setCurrentDate(new Date())

    return (
        <div className="p-6">
            {/* Calendar header */}
            <div className="flex items-center gap-3 mb-4">
                <button
                    onClick={prevMonth}
                    className="p-1 rounded hover:bg-hover transition-colors cursor-pointer"
                >
                    <ChevronLeft size={16} />
                </button>
                <h3 className="text-base font-semibold min-w-[160px] text-center">
                    {MONTHS[month]} {year}
                </h3>
                <button
                    onClick={nextMonth}
                    className="p-1 rounded hover:bg-hover transition-colors cursor-pointer"
                >
                    <ChevronRight size={16} />
                </button>
                <button
                    onClick={today}
                    className="ml-2 text-xs text-button-bg hover:underline cursor-pointer"
                >
                    Today
                </button>
            </div>

            {!dateProp && (
                <div className="text-sm text-center-fg/40 mb-4">
                    Set a date property in the view options to see cards on the calendar.
                </div>
            )}

            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-border-default">
                {DAYS.map((day) => (
                    <div key={day} className="py-2 text-xs font-semibold text-center text-center-fg/50">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7">
                {calendarDays.map((day, idx) => {
                    const isToday = day.isCurrentMonth &&
                        day.date === new Date().getDate() &&
                        month === new Date().getMonth() &&
                        year === new Date().getFullYear()

                    return (
                        <div
                            key={idx}
                            className="min-h-[80px] border-b border-r border-border-subtle p-1"
                        >
                            <div className={`text-xs mb-1 ${
                                !day.isCurrentMonth ? 'text-center-fg/20' :
                                isToday ? 'font-bold text-button-bg' :
                                'text-center-fg/60'
                            }`}>
                                {day.date}
                            </div>
                            {day.cards.map((card) => (
                                <div
                                    key={card.id}
                                    onClick={() => handleCardClick(card)}
                                    className="text-xs px-1.5 py-0.5 mb-0.5 rounded bg-button-bg/10 text-button-bg truncate cursor-pointer hover:bg-button-bg/20 transition-colors"
                                >
                                    {card.fields?.icon && <span className="mr-0.5">{card.fields.icon}</span>}
                                    {card.title || 'Untitled'}
                                </div>
                            ))}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
