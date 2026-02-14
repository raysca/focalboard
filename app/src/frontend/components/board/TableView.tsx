import React, {useMemo} from 'react'
import {useNavigate} from '@tanstack/react-router'
import {EditableCell} from './EditableCell'
import {TableGroupHeader} from './TableGroupHeader'
import {useGroupCards} from '../../hooks/useGroupCards'
import {useInsertBlocksMutation} from '../../hooks/useBlocks'
import type {Board, BoardView, Card} from '../../api/types'

interface TableViewProps {
    board: Board
    cards: Card[]
    activeView?: BoardView
}

export function TableView({board, cards, activeView}: TableViewProps) {
    const navigate = useNavigate()
    const insertBlocks = useInsertBlocksMutation(board?.id || '')

    // Early return if board data is not loaded yet
    if (!board || !board.cardProperties) {
        return (
            <div className="flex-1 flex items-center justify-center p-8 text-center-fg/40 text-sm">
                Loading board...
            </div>
        )
    }

    // Determine groupBy property
    const groupByPropId = activeView?.fields?.groupById
    const groupByProperty = board.cardProperties?.find((p) => p.id === groupByPropId)

    // Determine visible columns (exclude groupBy column if grouping is active)
    const visiblePropIds = activeView?.fields?.visiblePropertyIds || board.cardProperties?.map((p) => p.id) || []
    const columns = board.cardProperties?.filter(
        (p) => visiblePropIds.includes(p.id) && p.id !== groupByProperty?.id
    ) || []

    // Apply sorting
    const sortedCards = useMemo(() => {
        if (!activeView?.fields?.sortOptions || activeView.fields.sortOptions.length === 0) {
            return cards
        }

        const sorted = [...cards]
        const sortOption = activeView.fields.sortOptions[0] // Use first sort option

        sorted.sort((a, b) => {
            const aValue = a.fields?.properties?.[sortOption.propertyId]
            const bValue = b.fields?.properties?.[sortOption.propertyId]

            // Handle undefined/null values
            if (!aValue && !bValue) return 0
            if (!aValue) return 1
            if (!bValue) return -1

            // String comparison
            const comparison = String(aValue).localeCompare(String(bValue))
            return sortOption.reversed ? -comparison : comparison
        })

        return sorted
    }, [cards, activeView])

    // Group cards
    const groups = useGroupCards(sortedCards, groupByProperty, activeView?.fields)
    const isGrouped = !!groupByProperty

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

    const handleAddCard = (groupId: string) => {
        const properties: Record<string, string> = {}
        if (groupByProperty && groupId && groupId !== '__no_value') {
            properties[groupByProperty.id] = groupId
        }

        const newCard: any = {
            boardId: board.id,
            parentId: board.id,
            type: 'card',
            title: '',
            fields: {
                properties,
                contentOrder: [],
            },
            schema: 1,
        }

        insertBlocks.mutate([newCard])
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
                    {isGrouped ? (
                        groups.map((group) => (
                            <React.Fragment key={group.id}>
                                <TableGroupHeader
                                    groupName={group.name}
                                    groupId={group.id}
                                    itemCount={group.cards.length}
                                    colSpan={columns.length + 1}
                                    onAddCard={() => handleAddCard(group.id)}
                                />
                                {group.cards.map((card) => (
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
                                            <EditableCell
                                                key={col.id}
                                                template={col}
                                                value={card.fields?.properties?.[col.id]}
                                                cardId={card.id}
                                                boardId={board.id}
                                            />
                                        ))}
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))
                    ) : (
                        sortedCards.map((card) => (
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
                                    <EditableCell
                                        key={col.id}
                                        template={col}
                                        value={card.fields?.properties?.[col.id]}
                                        cardId={card.id}
                                        boardId={board.id}
                                    />
                                ))}
                            </tr>
                        ))
                    )}
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

            {/* Total count */}
            <div className="text-sm text-center-fg/60 mt-4 px-3">
                Total: {cards.length}
            </div>
        </div>
    )
}
