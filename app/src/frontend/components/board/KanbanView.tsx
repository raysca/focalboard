import React, {useMemo, useState} from 'react'
import {useNavigate} from '@tanstack/react-router'
import {Plus} from 'lucide-react'
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners,
    type DragStartEvent,
    type DragEndEvent,
    type DragOverEvent,
} from '@dnd-kit/core'
import {SortableContext, verticalListSortingStrategy, useSortable} from '@dnd-kit/sortable'
import {CSS} from '@dnd-kit/utilities'
import {cn} from '../../lib/cn'
import {PropertyValue} from './PropertyValue'
import {DependencyBadge} from '../dependencies/DependencyBadge'
import {useInsertBlocksMutation, usePatchBlockMutation} from '../../hooks/useBlocks'
import type {Board, BoardView, Card, Block, IPropertyTemplate, IPropertyOption} from '../../api/types'

interface KanbanViewProps {
    board: Board
    cards: Card[]
    activeView?: BoardView
    contents?: Block[]
}

// --- Sortable card wrapper ---
function SortableCard({card, visibleProps, onClick}: {card: Card; visibleProps: IPropertyTemplate[]; onClick: () => void}) {
    const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({
        id: card.id,
        data: {type: 'card', card},
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onClick}
            className={cn(
                'rounded-[var(--radius-default)] p-3 px-4 cursor-grab text-center-fg shadow-card hover:bg-hover transition-colors bg-center-bg',
                isDragging && 'opacity-30'
            )}
        >
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 flex-1">
                    {card.fields?.icon && (
                        <span className="text-base">{card.fields.icon}</span>
                    )}
                    <span className="text-sm font-medium">
                        {card.title || 'Untitled'}
                    </span>
                </div>
                <DependencyBadge cardId={card.id} variant="compact" />
            </div>

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
    )
}

// --- Drag overlay card (the floating ghost) ---
function CardOverlay({card, visibleProps}: {card: Card; visibleProps: IPropertyTemplate[]}) {
    return (
        <div className="rounded-[var(--radius-default)] p-3 px-4 text-center-fg shadow-elevation-4 bg-center-bg rotate-2 w-[var(--kanban-column-width)]">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 flex-1">
                    {card.fields?.icon && (
                        <span className="text-base">{card.fields.icon}</span>
                    )}
                    <span className="text-sm font-medium">
                        {card.title || 'Untitled'}
                    </span>
                </div>
                <DependencyBadge cardId={card.id} variant="compact" />
            </div>
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
    )
}

// --- Droppable column ---
function DroppableColumn({groupId, children}: {groupId: string; children: React.ReactNode}) {
    const {setNodeRef} = useSortable({
        id: `column-${groupId}`,
        data: {type: 'column', groupId},
        disabled: true,
    })

    return (
        <div ref={setNodeRef} className="flex flex-col gap-2 min-h-[50px]">
            {children}
        </div>
    )
}

export function KanbanView({board, cards, activeView, contents}: KanbanViewProps) {
    const navigate = useNavigate()
    const insertBlocks = useInsertBlocksMutation(board.id)
    const patchBlock = usePatchBlockMutation(board.id)
    const [activeCard, setActiveCard] = useState<Card | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {distance: 5},
        })
    )

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
            return [{id: '', name: 'No Group', color: 'default', cards, collapsed: false}]
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

    // --- DnD handlers ---
    const handleDragStart = (event: DragStartEvent) => {
        const {active} = event
        const card = cards.find((c) => c.id === active.id)
        if (card) setActiveCard(card)
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const {active, over} = event
        setActiveCard(null)

        if (!over || !effectiveGroupBy) return

        const cardId = active.id as string
        const card = cards.find((c) => c.id === cardId)
        if (!card) return

        // Determine target group
        let targetGroupId: string | null = null

        if (over.data?.current?.type === 'column') {
            targetGroupId = over.data.current.groupId
        } else if (over.data?.current?.type === 'card') {
            // Find which group the target card belongs to
            const overCard = over.data.current.card as Card
            const overPropValue = overCard.fields?.properties?.[effectiveGroupBy.id]
            targetGroupId = overPropValue || null
        }

        if (targetGroupId === null) return

        // Check if the card is already in the target group
        const currentPropValue = card.fields?.properties?.[effectiveGroupBy.id]
        if (currentPropValue === targetGroupId) return

        // Update the card's groupBy property
        const updatedProperties = {
            ...(card.fields?.properties || {}),
            [effectiveGroupBy.id]: targetGroupId === '__no_value' ? '' : targetGroupId,
        }

        patchBlock.mutate({
            blockId: cardId,
            patch: {fields: {...card.fields, properties: updatedProperties}},
        })
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
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

                        {/* Cards with sortable context */}
                        <SortableContext
                            items={group.cards.map((c) => c.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <DroppableColumn groupId={group.id}>
                                {group.cards.map((card) => (
                                    <SortableCard
                                        key={card.id}
                                        card={card}
                                        visibleProps={visibleProps}
                                        onClick={() => handleCardClick(card)}
                                    />
                                ))}
                            </DroppableColumn>
                        </SortableContext>

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

            {/* Drag overlay — renders the floating card ghost */}
            <DragOverlay dropAnimation={null}>
                {activeCard && (
                    <CardOverlay card={activeCard} visibleProps={visibleProps} />
                )}
            </DragOverlay>
        </DndContext>
    )
}
