import React from 'react'
import {useNavigate} from '@tanstack/react-router'
import {PropertyValue} from './PropertyValue'
import type {Board, BoardView, Card} from '../../api/types'

interface TableViewProps {
    board: Board
    cards: Card[]
    activeView?: BoardView
}

export function TableView({board, cards, activeView}: TableViewProps) {
    const navigate = useNavigate()

    // Determine visible columns
    const visiblePropIds = activeView?.fields?.visiblePropertyIds || board.cardProperties?.map((p) => p.id) || []
    const columns = board.cardProperties?.filter((p) => visiblePropIds.includes(p.id)) || []

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

    return (
        <div className="overflow-auto p-4">
            <table className="w-full border-collapse text-sm">
                <thead>
                    <tr className="border-b border-border-default">
                        <th className="text-left py-2 px-3 font-semibold text-center-fg/60 w-[200px]">
                            Name
                        </th>
                        {columns.map((col) => (
                            <th
                                key={col.id}
                                className="text-left py-2 px-3 font-semibold text-center-fg/60 min-w-[120px]"
                            >
                                {col.name}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {cards.map((card) => (
                        <tr
                            key={card.id}
                            onClick={() => handleCardClick(card)}
                            className="border-b border-border-subtle hover:bg-hover cursor-pointer transition-colors"
                        >
                            <td className="py-2 px-3">
                                <div className="flex items-center gap-1.5">
                                    {card.fields?.icon && (
                                        <span className="text-sm">{card.fields.icon}</span>
                                    )}
                                    <span className="font-medium">{card.title || 'Untitled'}</span>
                                </div>
                            </td>
                            {columns.map((col) => (
                                <td key={col.id} className="py-2 px-3">
                                    <PropertyValue
                                        template={col}
                                        value={card.fields?.properties?.[col.id]}
                                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                    {cards.length === 0 && (
                        <tr>
                            <td
                                colSpan={columns.length + 1}
                                className="py-8 px-3 text-center text-center-fg/40"
                            >
                                No cards. Click "+ New" to add one.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}
