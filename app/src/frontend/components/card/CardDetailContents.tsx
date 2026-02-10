import React, {useState} from 'react'
import {Plus, Type, Image, Minus, CheckSquare, Heading1, Heading2, Heading3} from 'lucide-react'
import {cn} from '../../lib/cn'
import type {Block} from '../../api/types'
import {ChecklistProgress} from './ChecklistProgress'

interface CardDetailContentsProps {
    contents: Block[]
    contentOrder: string[]
    onAddBlock: (type: string, afterBlockId?: string) => void
    onUpdateBlock: (blockId: string, patch: Partial<Block>) => void
    onDeleteBlock: (blockId: string) => void
}

export function CardDetailContents({contents, contentOrder, onAddBlock, onUpdateBlock, onDeleteBlock}: CardDetailContentsProps) {
    const [showMenu, setShowMenu] = useState(false)

    // Sort contents by contentOrder
    const orderedContents = contentOrder
        .map((id) => contents.find((b) => b.id === id))
        .filter(Boolean) as Block[]

    // Include any contents not in contentOrder
    const unorderedContents = contents.filter((b) => !contentOrder.includes(b.id))
    const allContents = [...orderedContents, ...unorderedContents]

    // Calculate checklist progress
    const checkboxes = allContents.filter(b => b.type === 'checkbox')
    const completedCheckboxes = checkboxes.filter(b => b.fields?.value === 'true')
    const hasCheckboxes = checkboxes.length > 0

    return (
        <div className="px-6 py-4 min-h-[120px]">
            {allContents.length === 0 && !showMenu && (
                <div
                    className="text-sm text-center-fg/30 cursor-pointer hover:text-center-fg/50 transition-colors"
                    onClick={() => setShowMenu(true)}
                >
                    Add content...
                </div>
            )}

            {/* Checklist progress indicator */}
            {hasCheckboxes && (
                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-xs font-semibold text-center-fg/70 uppercase tracking-wide">
                            Checklist
                        </h4>
                    </div>
                    <ChecklistProgress
                        completed={completedCheckboxes.length}
                        total={checkboxes.length}
                    />
                </div>
            )}

            {/* Content blocks */}
            {allContents.map((block) => (
                <ContentBlockRenderer
                    key={block.id}
                    block={block}
                    onUpdate={(patch) => onUpdateBlock(block.id, patch)}
                    onDelete={() => onDeleteBlock(block.id)}
                    onAddBelow={(type) => onAddBlock(type, block.id)}
                />
            ))}

            {/* Add content menu */}
            <div className="mt-3">
                {showMenu ? (
                    <div className="flex items-center gap-1 flex-wrap">
                        {contentBlockTypes.map(({type, label, icon: Icon}) => (
                            <button
                                key={type}
                                onClick={() => { onAddBlock(type); setShowMenu(false) }}
                                className="flex items-center gap-1.5 h-7 px-2.5 rounded text-xs text-center-fg/60 hover:text-center-fg hover:bg-hover transition-colors cursor-pointer"
                            >
                                <Icon size={13} />
                                <span>{label}</span>
                            </button>
                        ))}
                        <button
                            onClick={() => setShowMenu(false)}
                            className="text-xs text-center-fg/30 hover:text-center-fg/50 ml-2 cursor-pointer"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    allContents.length > 0 && (
                        <button
                            onClick={() => setShowMenu(true)}
                            className="flex items-center gap-1 text-xs text-center-fg/30 hover:text-center-fg/50 transition-colors cursor-pointer"
                        >
                            <Plus size={14} />
                            <span>Add content</span>
                        </button>
                    )
                )}
            </div>
        </div>
    )
}

const contentBlockTypes = [
    {type: 'text', label: 'Text', icon: Type},
    {type: 'image', label: 'Image', icon: Image},
    {type: 'divider', label: 'Divider', icon: Minus},
    {type: 'checkbox', label: 'Checkbox', icon: CheckSquare},
]

interface ContentBlockRendererProps {
    block: Block
    onUpdate: (patch: Partial<Block>) => void
    onDelete: () => void
    onAddBelow: (type: string) => void
}

function ContentBlockRenderer({block, onUpdate, onDelete, onAddBelow}: ContentBlockRendererProps) {
    const [editing, setEditing] = useState(false)
    const [draft, setDraft] = useState(block.title || '')

    const saveText = () => {
        if (draft !== (block.title || '')) {
            onUpdate({title: draft})
        }
        setEditing(false)
    }

    switch (block.type) {
        case 'text':
            return (
                <div className="group relative py-1">
                    {editing ? (
                        <textarea
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onBlur={saveText}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') { setDraft(block.title || ''); setEditing(false) }
                            }}
                            className="w-full text-sm bg-transparent border border-button-bg/30 rounded p-1 outline-none text-center-fg resize-y min-h-[60px]"
                            autoFocus
                        />
                    ) : (
                        <div
                            onClick={() => { setDraft(block.title || ''); setEditing(true) }}
                            className={cn(
                                'text-sm whitespace-pre-wrap rounded p-1 cursor-text hover:bg-hover transition-colors min-h-[24px]',
                                !block.title && 'text-center-fg/30'
                            )}
                        >
                            {block.title || 'Type something...'}
                        </div>
                    )}
                    <DeleteButton onDelete={onDelete} />
                </div>
            )

        case 'divider':
            return (
                <div className="group relative py-2">
                    <div className="h-px bg-border-default" />
                    <DeleteButton onDelete={onDelete} />
                </div>
            )

        case 'checkbox':
            return (
                <div className="group relative flex items-start gap-2.5 py-1.5">
                    <button
                        onClick={() => {
                            const checked = block.fields?.value === 'true'
                            onUpdate({fields: {...block.fields, value: checked ? 'false' : 'true'}})
                        }}
                        className={cn(
                            'w-[18px] h-[18px] rounded border-2 flex items-center justify-center cursor-pointer transition-all shrink-0 mt-0.5',
                            block.fields?.value === 'true'
                                ? 'bg-button-bg border-button-bg text-button-fg scale-105'
                                : 'border-center-fg/40 hover:border-center-fg/60'
                        )}
                    >
                        {block.fields?.value === 'true' && (
                            <span className="text-[11px] font-bold">✓</span>
                        )}
                    </button>
                    {editing ? (
                        <input
                            type="text"
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onBlur={saveText}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault()
                                    saveText()
                                    // Create new checkbox below
                                    onAddBelow('checkbox')
                                }
                                if (e.key === 'Escape') {
                                    setDraft(block.title || '')
                                    setEditing(false)
                                }
                            }}
                            className="flex-1 text-sm bg-transparent border-b border-button-bg/30 outline-none text-center-fg pb-0.5"
                            autoFocus
                            placeholder="Checklist item"
                        />
                    ) : (
                        <span
                            onClick={() => { setDraft(block.title || ''); setEditing(true) }}
                            className={cn(
                                'flex-1 text-sm cursor-text py-0.5',
                                block.fields?.value === 'true' && 'line-through text-center-fg/40',
                                !block.title && 'text-center-fg/30 italic'
                            )}
                        >
                            {block.title || 'Click to add task'}
                        </span>
                    )}
                    <DeleteButton onDelete={onDelete} />
                </div>
            )

        case 'image':
            return (
                <div className="group relative py-2">
                    <div className="bg-center-fg/5 rounded p-4 text-center text-xs text-center-fg/30">
                        {block.fields?.fileId ? (
                            <img
                                src={`/api/v2/files/${block.fields.fileId}`}
                                alt=""
                                className="max-w-full rounded"
                            />
                        ) : (
                            'Image block'
                        )}
                    </div>
                    <DeleteButton onDelete={onDelete} />
                </div>
            )

        default:
            return (
                <div className="group relative py-1 text-xs text-center-fg/40">
                    Unknown block type: {block.type}
                    <DeleteButton onDelete={onDelete} />
                </div>
            )
    }
}

function DeleteButton({onDelete}: {onDelete: () => void}) {
    return (
        <button
            onClick={onDelete}
            className="absolute -right-6 top-1 opacity-0 group-hover:opacity-100 p-0.5 rounded text-center-fg/30 hover:text-error hover:bg-error/10 transition-all cursor-pointer"
            title="Delete block"
        >
            <span className="text-xs">×</span>
        </button>
    )
}
