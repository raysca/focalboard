import React, {useMemo} from 'react'
import {useNavigate} from '@tanstack/react-router'
import {Plus} from 'lucide-react'
import {cn} from '../../lib/cn'
import {PropertyValue} from './PropertyValue'
import {useInsertBlocksMutation, usePatchBlockMutation} from '../../hooks/useBlocks'
import type {Board, BoardView, Card, Block, IPropertyTemplate, IPropertyOption} from '../../api/types'

interface KanbanViewProps {
    board: Board
    cards: Card[]
    activeView?: BoardView
    contents?: Block[]
}

export function KanbanView({board, cards, activeView, contents}: KanbanViewProps) {
    const navigate = useNavigate()
    const insertBlocks = useInsertBlocksMutation(board.id)
    const patchBlock = usePatchBlockMutation(board.id)

    // Determine groupBy property
    const groupByPropId = activeView?.fields?.groupById
    const groupByProp = board.cardProperties?.find((p) => p.id === groupByPropId)

    // Default to first select property if none specified
    const effectiveGroupBy = groupByProp || board.cardProperties?.find((p) => p.type === 'select')

    // Visible properties for cards
    const visiblePropIds = activeView?.fields?.visiblePropertyIds || []
    const visibleProps = board.cardProperties?.filter(
        (p) => visiblePropIds.includes(p.id) && p.id !== effectiveGroupBy?.id
    ) || []

    // Group cards by property value
    const groups = useMemo(() => {
        if (!effectiveGroupBy || !effectiveGroupBy.options) {
            return [{id: '', name: 'No Group', color: 'default', cards}]
        }

        const collapsedIds = new Set(activeView?.fields?.collapsedOptionIds || [])
        const hiddenIds = new Set(activeView?.fields?.hiddenOptionIds || [])

        const optionGroups = effectiveGroupBy.options
            .filter((opt: IPropertyOption) => !hiddenIds.has(opt.id))
            .map((opt: IPropertyOption) => ({
                id: opt.id,
                name: opt.value,
                color: opt.color,
                collapsed: collapsedIds.has(opt.id),
                cards: cards.filter((card) => {
                    const propValue = card.fields?.properties?.[effectiveGroupBy.id]
                    return propValue === opt.id
                }),
            }))

        // Add "No Value" group for cards without the property
        const ungrouped = cards.filter((card) => {
            const propValue = card.fields?.properties?.[effectiveGroupBy.id]
            return !propValue || !effectiveGroupBy.options?.some((o: IPropertyOption) => o.id === propValue)
        })

        if (ungrouped.length > 0) {
            optionGroups.push({
                id: '__no_value',
                name: 'No Status',
                color: 'default',
                collapsed: false,
                cards: ungrouped,
            })
        }

        return optionGroups
    }, [cards, effectiveGroupBy, activeView])

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

    const handleNewCard = (groupId: string) => {
        const properties: Record<string, string> = {}
        if (effectiveGroupBy && groupId && groupId !== '__no_value') {
            properties[effectiveGroupBy.id] = groupId
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
        <div className="flex gap-4 p-6 overflow-x-auto h-full items-start">
            {groups.map((group) => (
                <div
                    key={group.id}
                    className="shrink-0 flex flex-col w-[var(--kanban-column-width)]"
                >
                    {/* Column header */}
                    <div className="flex items-center gap-2 px-1 pb-3">
                        <span className={cn(
                            'text-xs font-semibold uppercase tracking-wider text-center-fg/50'
                        )}>
                            {group.name}
                        </span>
                        <span className="text-xs text-center-fg/30">{group.cards.length}</span>
                    </div>

                    {/* Cards */}
                    <div className="flex flex-col gap-2 min-h-[50px]">
                        {group.cards.map((card) => (
                            <div
                                key={card.id}
                                onClick={() => handleCardClick(card)}
                                className="rounded-[var(--radius-default)] p-3 px-4 cursor-pointer text-center-fg shadow-card hover:bg-hover transition-colors bg-center-bg"
                            >
                                {card.fields?.icon && (
                                    <span className="text-base mr-1">{card.fields.icon}</span>
                                )}
                                <span className="text-sm font-medium">
                                    {card.title || 'Untitled'}
                                </span>

                                {/* Property badges */}
                                {visibleProps.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {visibleProps.map((prop) => {
                                            const propValue = card.fields?.properties?.[prop.id]
                                            return (
                                                <PropertyValue
                                                    key={prop.id}
                                                    template={prop}
                                                    value={propValue}
                                                />
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Add card button */}
                    <button
                        onClick={() => handleNewCard(group.id)}
                        className="flex items-center gap-1 mt-2 px-2 py-1.5 rounded text-center-fg/40 hover:text-center-fg/70 hover:bg-hover text-xs transition-colors cursor-pointer"
                    >
                        <Plus size={14} />
                        <span>New</span>
                    </button>
                </div>
            ))}
        </div>
    )
}
