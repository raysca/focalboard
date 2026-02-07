import React from 'react'
import {useNavigate} from '@tanstack/react-router'
import {PropertyValue} from './PropertyValue'
import type {Board, BoardView, Card} from '../../api/types'

interface GalleryViewProps {
    board: Board
    cards: Card[]
    activeView?: BoardView
}

export function GalleryView({board, cards, activeView}: GalleryViewProps) {
    const navigate = useNavigate()

    const visiblePropIds = activeView?.fields?.visiblePropertyIds || []
    const visibleProps = board.cardProperties?.filter((p) => visiblePropIds.includes(p.id)) || []

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
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4 p-6">
            {cards.map((card) => (
                <div
                    key={card.id}
                    onClick={() => handleCardClick(card)}
                    className="rounded-[var(--radius-default)] shadow-card bg-center-bg hover:bg-hover transition-colors cursor-pointer overflow-hidden"
                >
                    {/* Card image placeholder */}
                    <div className="h-[160px] bg-center-fg/5 flex items-center justify-center text-3xl">
                        {card.fields?.icon || '📄'}
                    </div>

                    {/* Card content */}
                    <div className="p-3">
                        <div className="font-medium text-sm mb-2">
                            {card.title || 'Untitled'}
                        </div>

                        {visibleProps.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {visibleProps.map((prop) => (
                                    <PropertyValue
                                        key={prop.id}
                                        template={prop}
                                        value={card.fields?.properties?.[prop.id]}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ))}

            {cards.length === 0 && (
                <div className="col-span-full py-12 text-center text-center-fg/40 text-sm">
                    No cards. Click "+ New" to add one.
                </div>
            )}
        </div>
    )
}
