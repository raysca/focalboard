import React, {useState, useRef, useEffect} from 'react'
import {Check, X} from 'lucide-react'
import {cn} from '../../lib/cn'
import {PropertyValue} from './PropertyValue'
import {usePatchBlockMutation} from '../../hooks/useBlocks'
import type {IPropertyTemplate, IPropertyOption} from '../../api/types'

interface EditableCellProps {
    template: IPropertyTemplate
    value: any
    cardId: string
    boardId: string
}

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

export function EditableCell({template, value, cardId, boardId}: EditableCellProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [editValue, setEditValue] = useState(value)
    const patchBlock = usePatchBlockMutation(boardId)
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Read-only property types
    const isReadOnly = ['createdTime', 'createdBy', 'updatedTime', 'updatedBy'].includes(template.type)

    useEffect(() => {
        setEditValue(value)
    }, [value])

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isEditing])

    useEffect(() => {
        if (!isEditing) return

        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                handleSave()
            }
        }

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleCancel()
            } else if (e.key === 'Enter' && template.type !== 'text') {
                handleSave()
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleEscape)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [isEditing, editValue])

    const handleSave = () => {
        if (patchBlock.isPending) return

        // Validate and save
        let finalValue = editValue

        if (template.type === 'number' && editValue !== '' && editValue !== null && editValue !== undefined) {
            const num = Number(editValue)
            if (isNaN(num)) {
                handleCancel()
                return
            }
            finalValue = String(num)
        }

        if (template.type === 'url' && editValue) {
            // Basic URL validation
            const urlPattern = /^https?:\/\/.+/
            if (!urlPattern.test(editValue)) {
                handleCancel()
                return
            }
        }

        if (template.type === 'email' && editValue) {
            // Basic email validation
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailPattern.test(editValue)) {
                handleCancel()
                return
            }
        }

        patchBlock.mutate(
            {
                blockId: cardId,
                patch: {
                    fields: {
                        properties: {
                            [template.id]: finalValue,
                        },
                    },
                },
            },
            {
                onSuccess: () => {
                    setIsEditing(false)
                },
                onError: () => {
                    // Revert on error
                    setEditValue(value)
                    setIsEditing(false)
                },
            }
        )
    }

    const handleCancel = () => {
        setEditValue(value)
        setIsEditing(false)
    }

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!isReadOnly && !isEditing) {
            setIsEditing(true)
        }
    }

    const handleSelectOption = (optionId: string) => {
        if (template.type === 'multiSelect') {
            const currentValues = Array.isArray(editValue) ? editValue : []
            const newValues = currentValues.includes(optionId)
                ? currentValues.filter((v: string) => v !== optionId)
                : [...currentValues, optionId]
            setEditValue(newValues)
        } else {
            setEditValue(optionId)
            // Auto-save for select
            patchBlock.mutate(
                {
                    blockId: cardId,
                    patch: {
                        fields: {
                            properties: {
                                [template.id]: optionId,
                            },
                        },
                    },
                },
                {
                    onSuccess: () => {
                        setIsEditing(false)
                    },
                }
            )
        }
    }

    const handleCheckboxToggle = () => {
        const newValue = value === 'true' ? 'false' : 'true'
        patchBlock.mutate({
            blockId: cardId,
            patch: {
                fields: {
                    properties: {
                        [template.id]: newValue,
                    },
                },
            },
        })
    }

    // Render editor based on property type
    const renderEditor = () => {
        switch (template.type) {
            case 'select':
            case 'multiSelect': {
                return (
                    <div className="absolute top-full left-0 mt-1 w-[200px] bg-center-bg border border-border-default rounded-[var(--radius-default)] shadow-elevation-3 z-50 py-1 max-h-[250px] overflow-y-auto">
                        {template.options?.map((option: IPropertyOption) => {
                            const isSelected =
                                template.type === 'multiSelect'
                                    ? Array.isArray(editValue) && editValue.includes(option.id)
                                    : editValue === option.id
                            const colorClass = propColorMap[option.color] || propColorMap.default

                            return (
                                <button
                                    key={option.id}
                                    onClick={() => handleSelectOption(option.id)}
                                    className={cn(
                                        'w-full text-left px-3 py-1.5 hover:bg-hover transition-colors cursor-pointer flex items-center gap-2',
                                        isSelected && 'bg-button-bg/5'
                                    )}
                                >
                                    {template.type === 'multiSelect' && (
                                        <div
                                            className={cn(
                                                'w-3.5 h-3.5 rounded-sm border border-center-fg/20 flex items-center justify-center text-[10px]',
                                                isSelected && 'bg-button-bg border-button-bg text-button-fg'
                                            )}
                                        >
                                            {isSelected && '✓'}
                                        </div>
                                    )}
                                    <span className={cn('text-xs px-2 py-0.5 rounded-sm font-medium', colorClass)}>
                                        {option.value}
                                    </span>
                                </button>
                            )
                        })}
                        {template.type === 'multiSelect' && (
                            <div className="border-t border-border-subtle mt-1 pt-1 px-2">
                                <button
                                    onClick={handleSave}
                                    className="w-full text-xs py-1 px-2 bg-button-bg text-button-fg rounded hover:bg-button-bg/90 transition-colors"
                                >
                                    Done
                                </button>
                            </div>
                        )}
                    </div>
                )
            }

            case 'text':
            case 'url':
            case 'email':
            case 'phone': {
                return (
                    <input
                        ref={inputRef}
                        type="text"
                        value={editValue || ''}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault()
                                handleSave()
                            }
                        }}
                        className="w-full text-xs border border-button-bg rounded px-2 py-1 bg-transparent outline-none"
                    />
                )
            }

            case 'number': {
                return (
                    <input
                        ref={inputRef}
                        type="number"
                        value={editValue || ''}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault()
                                handleSave()
                            }
                        }}
                        className="w-full text-xs border border-button-bg rounded px-2 py-1 bg-transparent outline-none"
                    />
                )
            }

            case 'date': {
                // Simple date input for now
                return (
                    <input
                        ref={inputRef}
                        type="date"
                        value={editValue || ''}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault()
                                handleSave()
                            }
                        }}
                        className="w-full text-xs border border-button-bg rounded px-2 py-1 bg-transparent outline-none"
                    />
                )
            }

            default:
                return null
        }
    }

    return (
        <td
            ref={containerRef}
            onClick={handleClick}
            className={cn(
                'py-2 px-3 relative',
                !isReadOnly && 'cursor-pointer hover:bg-hover/50',
                isEditing && 'bg-hover/50'
            )}
        >
            {template.type === 'checkbox' ? (
                <div onClick={(e) => e.stopPropagation()}>
                    <button onClick={handleCheckboxToggle} className="text-sm">
                        {value === 'true' ? '✅' : '⬜'}
                    </button>
                </div>
            ) : isEditing ? (
                <>
                    {template.type === 'select' || template.type === 'multiSelect' ? (
                        <div className="text-xs text-center-fg/70">
                            {template.type === 'select' ? 'Select option...' : 'Select options...'}
                        </div>
                    ) : (
                        renderEditor()
                    )}
                    {renderEditor()}
                </>
            ) : (
                <div className={cn(patchBlock.isPending && 'opacity-50')}>
                    <PropertyValue template={template} value={value} />
                </div>
            )}
        </td>
    )
}
