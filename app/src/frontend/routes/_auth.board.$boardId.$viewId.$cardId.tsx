import React, {useState, useEffect, useMemo} from 'react'
import {createRoute, useNavigate} from '@tanstack/react-router'
import {Route as boardRoute} from './_auth.board.$boardId'
import {X} from 'lucide-react'
import {useBoardQuery} from '../hooks/useBoards'
import {usePatchBlockMutation, useInsertBlocksMutation, useDeleteBlockMutation, useBoardDataQuery} from '../hooks/useBlocks'
import {CardDetailProperties} from '../components/card/CardDetailProperties'
import {CardDetailContents} from '../components/card/CardDetailContents'
import {CommentsList} from '../components/card/CommentsList'
import {api} from '../api/client'
import type {Block, Card} from '../api/types'

export const Route = createRoute({
    getParentRoute: () => boardRoute,
    path: '/$viewId/$cardId',
    component: CardDialog,
})

function CardDialog() {
    const {boardId, viewId, cardId} = Route.useParams()
    const navigate = useNavigate()
    const {data: board} = useBoardQuery(boardId)
    const {data: blockData} = useBoardDataQuery(boardId)
    const patchBlock = usePatchBlockMutation(boardId)
    const insertBlocks = useInsertBlocksMutation(boardId)
    const deleteBlock = useDeleteBlockMutation(boardId)
    const [card, setCard] = useState<Card | null>(null)
    const [title, setTitle] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.get<Card>(`/cards/${cardId}`)
            .then((data) => {
                setCard(data)
                setTitle(data.title || '')
            })
            .catch(() => setCard(null))
            .finally(() => setLoading(false))
    }, [cardId])

    // Get content blocks and comments for this card
    const {contentBlocks, comments} = useMemo(() => {
        const allContents = blockData?.contents || []
        const cardContents = allContents.filter((b: Block) => b.parentId === cardId)
        return {
            contentBlocks: cardContents.filter((b: Block) => b.type !== 'comment'),
            comments: cardContents.filter((b: Block) => b.type === 'comment'),
        }
    }, [blockData?.contents, cardId])

    const contentOrder: string[] = card?.fields?.contentOrder || []

    const handleClose = () => {
        navigate({to: '/board/$boardId', params: {boardId}})
    }

    const handleTitleBlur = () => {
        if (card && title !== card.title) {
            patchBlock.mutate({blockId: card.id, patch: {title}})
        }
    }

    const handlePropertyChange = (propertyId: string, value: any) => {
        if (!card) return
        const updatedProperties = {...(card.fields?.properties || {}), [propertyId]: value}
        patchBlock.mutate(
            {blockId: card.id, patch: {fields: {...card.fields, properties: updatedProperties}}},
            {
                onSuccess: () => {
                    setCard((prev) => prev ? {
                        ...prev,
                        fields: {...prev.fields, properties: updatedProperties}
                    } : null)
                }
            }
        )
    }

    const handleAddContentBlock = (type: string, _afterBlockId?: string) => {
        const newBlock: any = {
            boardId,
            parentId: cardId,
            type,
            title: '',
            fields: type === 'checkbox' ? {value: 'false'} : {},
            schema: 1,
        }
        insertBlocks.mutate([newBlock])
    }

    const handleUpdateContentBlock = (blockId: string, patch: Partial<Block>) => {
        patchBlock.mutate({blockId, patch})
    }

    const handleDeleteContentBlock = (blockId: string) => {
        deleteBlock.mutate(blockId)
    }

    const handleAddComment = (text: string) => {
        const newComment: any = {
            boardId,
            parentId: cardId,
            type: 'comment',
            title: text,
            fields: {},
            schema: 1,
        }
        insertBlocks.mutate([newComment])
    }

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    if (loading) return null

    if (!card) {
        return (
            <div className="fixed inset-0 bg-black/50 z-40 flex items-start justify-center pt-[10vh]" onClick={handleClose}>
                <div className="bg-center-bg rounded-[var(--radius-modal)] shadow-elevation-4 w-full max-w-3xl p-8" onClick={(e) => e.stopPropagation()}>
                    <div className="text-center text-center-fg/50">Card not found</div>
                </div>
            </div>
        )
    }

    const properties = card.fields?.properties || {}

    return (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-start justify-center pt-[10vh]" onClick={handleClose}>
            <div
                className="bg-center-bg rounded-[var(--radius-modal)] shadow-elevation-4 w-full max-w-3xl max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between p-6 pb-2">
                    <div className="flex-1">
                        {card.fields?.icon && (
                            <span className="text-3xl mb-2 block">{card.fields.icon}</span>
                        )}
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={handleTitleBlur}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault()
                                    ;(e.target as HTMLInputElement).blur()
                                }
                            }}
                            className="text-xl font-bold w-full bg-transparent border-none outline-none text-center-fg placeholder:text-center-fg/30"
                            placeholder="Untitled"
                        />
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded hover:bg-hover transition-colors cursor-pointer text-center-fg/50 hover:text-center-fg"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Divider */}
                <div className="h-px bg-border-default mx-6" />

                {/* Properties */}
                {board && (
                    <CardDetailProperties
                        properties={properties}
                        cardProperties={board.cardProperties || []}
                        onPropertyChange={handlePropertyChange}
                    />
                )}

                {/* Divider */}
                <div className="h-px bg-border-default mx-6" />

                {/* Content blocks */}
                <CardDetailContents
                    contents={contentBlocks}
                    contentOrder={contentOrder}
                    onAddBlock={handleAddContentBlock}
                    onUpdateBlock={handleUpdateContentBlock}
                    onDeleteBlock={handleDeleteContentBlock}
                />

                {/* Divider */}
                <div className="h-px bg-border-default mx-6" />

                {/* Comments */}
                <CommentsList
                    comments={comments}
                    onAddComment={handleAddComment}
                />
            </div>
        </div>
    )
}
