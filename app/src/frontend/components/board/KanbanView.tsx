import React, {useMemo, useState} from 'react'
import {useNavigate} from '@tanstack/react-router'
import {
    Plus, Flag, Calendar, MessageSquare, CheckSquare, MoreHorizontal,
    Circle, Clock, CircleDashed, CheckCircle2, CircleX, Trash2, UserPlus,
} from 'lucide-react'
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
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import {cn} from '../../lib/cn'
import {DependencyBadge} from '../dependencies/DependencyBadge'
import {useInsertBlocksMutation, usePatchBlockMutation, useDeleteBlockMutation} from '../../hooks/useBlocks'
import {useUsersByIdsQuery, getUserDisplay} from '../../hooks/useUsers'
import {useTourContext} from '../../contexts/TourContext'
import type {Board, BoardView, Card, Block, IPropertyTemplate, IPropertyOption} from '../../api/types'

interface KanbanViewProps {
    board: Board
    cards: Card[]
    activeView?: BoardView
    contents?: Block[]
}

// --- Color helpers ---

function getStatusIcon(color: string): React.ElementType {
    switch (color) {
        case 'yellow':
        case 'orange':
        case 'brown':
            return Clock
        case 'blue':
        case 'purple':
            return CircleDashed
        case 'green':
            return CheckCircle2
        case 'red':
        case 'pink':
            return CircleX
        default:
            return Circle
    }
}

function getStatusTextClass(color: string): string {
    switch (color) {
        case 'yellow':
            return 'text-yellow-600 dark:text-yellow-400'
        case 'orange':
            return 'text-orange-600 dark:text-orange-400'
        case 'brown':
            return 'text-amber-700 dark:text-amber-500'
        case 'blue':
            return 'text-blue-600 dark:text-blue-400'
        case 'purple':
            return 'text-purple-600 dark:text-purple-400'
        case 'green':
            return 'text-green-600 dark:text-green-400'
        case 'red':
            return 'text-red-600 dark:text-red-400'
        case 'pink':
            return 'text-pink-600 dark:text-pink-400'
        default:
            return 'text-muted-foreground'
    }
}

// Matches propColorMap in PropertyValue.tsx
const propColorMap: Record<string, string> = {
    default: 'bg-prop-default text-prop-text-default',
    gray: 'bg-prop-gray text-prop-text-gray',
    brown: 'bg-prop-brown text-prop-text-brown',
    orange: 'bg-prop-orange text-prop-text-orange',
    yellow: 'bg-prop-yellow text-prop-text-yellow',
    green: 'bg-prop-green text-prop-text-green',
    blue: 'bg-prop-blue text-prop-text-blue',
    purple: 'bg-prop-purple text-prop-text-purple',
    pink: 'bg-prop-pink text-prop-text-pink',
    red: 'bg-prop-red text-prop-text-red',
}

// --- Date formatting ---

function formatDate(raw: unknown): string | null {
    if (!raw) return null
    try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
        if (parsed?.from) {
            return new Date(parsed.from).toLocaleDateString('en-US', {day: 'numeric', month: 'long', year: 'numeric'})
        }
    } catch {
        // ignore
    }
    return null
}

// --- MemberAvatars sub-component ---

function MemberAvatars({userIds}: {userIds: string[]}) {
    const {data: users} = useUsersByIdsQuery(userIds)

    if (!userIds.length) {
        return (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <UserPlus size={12} /> Assign
            </span>
        )
    }

    const visible = users?.slice(0, 3) || []
    const overflow = userIds.length - 3

    return (
        <div className="flex items-center -space-x-1.5">
            {visible.map((user) => {
                const {initials} = getUserDisplay(user)
                return (
                    <span
                        key={user.id}
                        className="w-6 h-6 rounded-full bg-primary/20 border-2 border-card flex items-center justify-center text-[9px] font-bold text-primary shrink-0"
                        title={getUserDisplay(user).name}
                    >
                        {initials}
                    </span>
                )
            })}
            {overflow > 0 && (
                <span className="w-6 h-6 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[9px] font-bold text-muted-foreground shrink-0">
                    +{overflow}
                </span>
            )}
        </div>
    )
}

// --- CardMenu sub-component ---

function CardMenu({cardId, boardId}: {cardId: string; boardId: string}) {
    const deleteBlock = useDeleteBlockMutation(boardId)

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button
                    className="p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Card menu"
                >
                    <MoreHorizontal size={14} />
                </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    className="min-w-[140px] bg-card border border-border rounded-lg shadow-lg p-1 z-50"
                    sideOffset={4}
                    align="end"
                    onClick={(e) => e.stopPropagation()}
                >
                    <DropdownMenu.Item
                        className="flex items-center gap-2 text-xs text-destructive px-2.5 py-1.5 rounded cursor-pointer hover:bg-destructive/10 outline-none select-none"
                        onSelect={() => deleteBlock.mutate(cardId)}
                    >
                        <Trash2 size={12} />
                        Delete card
                    </DropdownMenu.Item>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    )
}

// --- Sortable card wrapper ---
function SortableCard({card, board, contents, onClick, cardIndex}: {
    card: Card
    board: Board
    contents?: Block[]
    onClick: () => void
    cardIndex?: number
}) {
    const {isOnboardingBoard} = useTourContext()
    const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({
        id: card.id,
        data: {type: 'card', card},
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    // Compute card-level data from contents
    const cardContents = contents?.filter(b => b.parentId === card.id) || []
    const description = cardContents.find(b => b.type === 'text' && (b as any).title)?.title as string | undefined
    const priorityProp = board.cardProperties?.find(p => p.name === 'Priority')
    const priorityOption = priorityProp
        ? priorityProp.options?.find((o: IPropertyOption) => o.id === card.fields?.properties?.[priorityProp.id])
        : undefined
    const dateProp = board.cardProperties?.find(p => p.type === 'date')
    const dateValue = dateProp ? card.fields?.properties?.[dateProp.id] : undefined
    const formattedDate = formatDate(dateValue)
    const personPropIds = board.cardProperties?.filter(p => p.type === 'person').map(p => p.id) || []
    const memberIds = personPropIds.map(id => card.fields?.properties?.[id]).filter(Boolean) as string[]
    const commentCount = cardContents.filter(b => b.type === 'comment').length
    const taskBlocks = cardContents.filter(b => b.type === 'checkbox')
    const completedTasks = taskBlocks.filter(b => (b as any).fields?.value === true || (b as any).fields?.value === 'true').length

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onClick}
            className={cn(
                'group bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow p-4 cursor-grab',
                isDragging && 'opacity-30'
            )}
            data-testid="card"
            data-tour-target={isOnboardingBoard && cardIndex !== undefined ? `onboarding-card-${cardIndex}` : undefined}
        >
            {/* Row 1: Priority badge + menu */}
            <div className="flex items-start justify-between mb-3">
                {priorityOption ? (
                    <span className={cn(
                        'inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium',
                        propColorMap[priorityOption.color] || propColorMap.default
                    )}>
                        <Flag size={10} className="fill-current shrink-0" />
                        {priorityOption.value}
                    </span>
                ) : <div />}
                <CardMenu cardId={card.id} boardId={board.id} />
            </div>

            {/* Title */}
            <p className="font-semibold text-foreground text-sm leading-snug mb-1.5">
                {card.fields?.icon && <span className="mr-1">{card.fields.icon}</span>}
                {card.title || 'Untitled'}
            </p>

            {/* Description */}
            {description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{description}</p>
            )}

            {/* Date */}
            {formattedDate && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                    <Calendar size={12} className="shrink-0" />
                    <span>{formattedDate}</span>
                </div>
            )}

            {/* Divider */}
            <div className="border-t border-border my-2" />

            {/* Footer */}
            <div className="flex items-center justify-between">
                <MemberAvatars userIds={memberIds} />
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {commentCount > 0 && (
                        <span className="flex items-center gap-1">
                            <MessageSquare size={12} />{commentCount}
                        </span>
                    )}
                    {taskBlocks.length > 0 && (
                        <span className="flex items-center gap-1">
                            <CheckSquare size={12} />{completedTasks}/{taskBlocks.length}
                        </span>
                    )}
                    <DependencyBadge cardId={card.id} variant="compact" />
                </div>
            </div>
        </div>
    )
}

// --- Drag overlay card (the floating ghost) ---
function CardOverlay({card, board, contents}: {card: Card; board: Board; contents?: Block[]}) {
    const cardContents = contents?.filter(b => b.parentId === card.id) || []
    const description = cardContents.find(b => b.type === 'text' && (b as any).title)?.title as string | undefined
    const priorityProp = board.cardProperties?.find(p => p.name === 'Priority')
    const priorityOption = priorityProp
        ? priorityProp.options?.find((o: IPropertyOption) => o.id === card.fields?.properties?.[priorityProp.id])
        : undefined
    const dateProp = board.cardProperties?.find(p => p.type === 'date')
    const dateValue = dateProp ? card.fields?.properties?.[dateProp.id] : undefined
    const formattedDate = formatDate(dateValue)
    const commentCount = cardContents.filter(b => b.type === 'comment').length
    const taskBlocks = cardContents.filter(b => b.type === 'checkbox')
    const completedTasks = taskBlocks.filter(b => (b as any).fields?.value === true || (b as any).fields?.value === 'true').length

    return (
        <div className="bg-card rounded-lg border border-border shadow-elevation-4 p-4 rotate-2 w-[var(--kanban-column-width)]">
            <div className="flex items-start justify-between mb-3">
                {priorityOption ? (
                    <span className={cn(
                        'inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium',
                        propColorMap[priorityOption.color] || propColorMap.default
                    )}>
                        <Flag size={10} className="fill-current shrink-0" />
                        {priorityOption.value}
                    </span>
                ) : <div />}
            </div>
            <p className="font-semibold text-foreground text-sm leading-snug mb-1.5">
                {card.fields?.icon && <span className="mr-1">{card.fields.icon}</span>}
                {card.title || 'Untitled'}
            </p>
            {description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{description}</p>
            )}
            {formattedDate && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                    <Calendar size={12} className="shrink-0" />
                    <span>{formattedDate}</span>
                </div>
            )}
            <div className="border-t border-border my-2" />
            <div className="flex items-center justify-end">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {commentCount > 0 && (
                        <span className="flex items-center gap-1">
                            <MessageSquare size={12} />{commentCount}
                        </span>
                    )}
                    {taskBlocks.length > 0 && (
                        <span className="flex items-center gap-1">
                            <CheckSquare size={12} />{completedTasks}/{taskBlocks.length}
                        </span>
                    )}
                </div>
            </div>
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
    const {advanceTour, tourCategory, isOnboardingBoard} = useTourContext()
    const insertBlocks = useInsertBlocksMutation(board?.id || '')
    const patchBlock = usePatchBlockMutation(board?.id || '')
    const [activeCard, setActiveCard] = useState<Card | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {distance: 5},
        })
    )

    // Early return if board data is not loaded yet
    if (!board || !board.cardProperties) {
        return (
            <div className="flex-1 flex items-center justify-center p-8 text-muted-foreground text-sm">
                Loading board...
            </div>
        )
    }

    // Determine groupBy property
    const groupByPropId = activeView?.fields?.groupById
    const groupByProp = board.cardProperties?.find((p) => p.id === groupByPropId)

    // Default to first select property if none specified
    const effectiveGroupBy = groupByProp || board.cardProperties?.find((p) => p.type === 'select') || undefined

    // Visible properties for cards
    const visiblePropIds = activeView?.fields?.visiblePropertyIds || []

    // Group cards by property value
    const groups = useMemo(() => {
        if (!effectiveGroupBy || !effectiveGroupBy.options) {
            return [{id: '', name: 'No Group', color: 'default', cards, collapsed: false}]
        }

        const collapsedIds = new Set(activeView?.fields?.collapsedOptionIds || [])
        const hiddenIds = new Set(activeView?.fields?.hiddenOptionIds || [])
        const isMultiSelectGrouping = effectiveGroupBy.type === 'multiSelect'

        const optionGroups = effectiveGroupBy.options
            .filter((opt: IPropertyOption) => !hiddenIds.has(opt.id))
            .map((opt: IPropertyOption) => ({
                id: opt.id,
                name: opt.value,
                color: opt.color,
                collapsed: collapsedIds.has(opt.id),
                cards: cards.filter((card) => {
                    const propValue = card.fields?.properties?.[effectiveGroupBy.id]
                    if (isMultiSelectGrouping) {
                        return Array.isArray(propValue) && propValue.includes(opt.id)
                    } else {
                        return propValue === opt.id
                    }
                }),
            }))

        // Add "No Value" group for cards without the property
        const ungrouped = cards.filter((card) => {
            const propValue = card.fields?.properties?.[effectiveGroupBy.id]
            if (isMultiSelectGrouping) {
                return !propValue || !Array.isArray(propValue) || propValue.length === 0
            } else {
                return !propValue || !effectiveGroupBy.options?.some((o: IPropertyOption) => o.id === propValue)
            }
        })

        if (ungrouped.length > 0) {
            optionGroups.push({
                id: '__no_value',
                name: isMultiSelectGrouping ? 'No Labels' : 'No Status',
                color: 'default',
                collapsed: false,
                cards: ungrouped,
            })
        }

        return optionGroups
    }, [cards, effectiveGroupBy, activeView])

    const handleCardClick = (card: Card) => {
        if (isOnboardingBoard && tourCategory === 'onboarding') {
            advanceTour()
        }

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

        const isMultiSelectGrouping = effectiveGroupBy.type === 'multiSelect'

        let targetGroupId: string | null = null

        if (over.data?.current?.type === 'column') {
            targetGroupId = over.data.current.groupId
        } else if (over.data?.current?.type === 'card') {
            const overCard = over.data.current.card as Card
            const overPropValue = overCard.fields?.properties?.[effectiveGroupBy.id]
            if (isMultiSelectGrouping) {
                return
            }
            targetGroupId = overPropValue || null
        }

        if (targetGroupId === null) return

        const currentPropValue = card.fields?.properties?.[effectiveGroupBy.id]
        let updatedProperties: Record<string, any>

        if (isMultiSelectGrouping) {
            const currentLabels = Array.isArray(currentPropValue) ? currentPropValue : []
            if (targetGroupId === '__no_value') {
                updatedProperties = {
                    ...(card.fields?.properties || {}),
                    [effectiveGroupBy.id]: [],
                }
            } else if (!currentLabels.includes(targetGroupId)) {
                updatedProperties = {
                    ...(card.fields?.properties || {}),
                    [effectiveGroupBy.id]: [...currentLabels, targetGroupId],
                }
            } else {
                return
            }
        } else {
            if (currentPropValue === targetGroupId) return
            updatedProperties = {
                ...(card.fields?.properties || {}),
                [effectiveGroupBy.id]: targetGroupId === '__no_value' ? '' : targetGroupId,
            }
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
                        <div className="flex items-center justify-between mb-3 px-1">
                            <div className={cn('flex items-center gap-2', getStatusTextClass(group.color))}>
                                {React.createElement(getStatusIcon(group.color), {size: 16})}
                                <span className="text-sm font-semibold">
                                    {group.name} ({group.cards.length})
                                </span>
                            </div>
                            <button
                                onClick={() => handleNewCard(group.id)}
                                className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
                                data-testid="add-card-button"
                                aria-label={`Add card to ${group.name}`}
                            >
                                <Plus size={16} />
                            </button>
                        </div>

                        {/* Cards with sortable context */}
                        <SortableContext
                            items={group.cards.map((c) => c.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <DroppableColumn groupId={group.id}>
                                {group.cards.map((card, index) => (
                                    <SortableCard
                                        key={card.id}
                                        card={card}
                                        board={board}
                                        contents={contents}
                                        onClick={() => handleCardClick(card)}
                                        cardIndex={index}
                                    />
                                ))}
                            </DroppableColumn>
                        </SortableContext>
                    </div>
                ))}
            </div>

            {/* Drag overlay — renders the floating card ghost */}
            <DragOverlay dropAnimation={null}>
                {activeCard && (
                    <CardOverlay card={activeCard} board={board} contents={contents} />
                )}
            </DragOverlay>
        </DndContext>
    )
}
