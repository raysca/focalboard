import React, {useState, useRef, useEffect} from 'react'
import {Tag, X} from 'lucide-react'
import {cn} from '../../lib/cn'
import type {IPropertyTemplate, IPropertyOption} from '../../api/types'

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

interface QuickLabelEditorProps {
    labelsProperty: IPropertyTemplate
    currentLabels: string[]
    onLabelsChange: (newLabels: string[]) => void
    compact?: boolean
}

export function QuickLabelEditor({labelsProperty, currentLabels = [], onLabelsChange, compact = false}: QuickLabelEditorProps) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const containerRef = useRef<HTMLDivElement>(null)

    const selectedOptions = (labelsProperty.options || []).filter((o) => currentLabels.includes(o.id))

    useEffect(() => {
        if (!open) return
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false)
                setSearch('')
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [open])

    const filteredOptions = (labelsProperty.options || []).filter((o) =>
        o.value.toLowerCase().includes(search.toLowerCase())
    )

    const toggleOption = (optionId: string) => {
        if (currentLabels.includes(optionId)) {
            onLabelsChange(currentLabels.filter((v) => v !== optionId))
        } else {
            onLabelsChange([...currentLabels, optionId])
        }
    }

    const removeOption = (optionId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        onLabelsChange(currentLabels.filter((v) => v !== optionId))
    }

    return (
        <div ref={containerRef} className="relative" onClick={(e) => e.stopPropagation()}>
            <button
                onClick={() => setOpen(!open)}
                className={cn(
                    'flex items-center gap-1 rounded hover:bg-hover transition-colors',
                    compact ? 'p-1' : 'px-2 py-1'
                )}
                title="Edit labels"
            >
                <Tag size={compact ? 12 : 14} className="text-center-fg/50" />
                {!compact && selectedOptions.length > 0 && (
                    <span className="text-xs text-center-fg/50">{selectedOptions.length}</span>
                )}
            </button>

            {open && (
                <div className="absolute top-full left-0 mt-1 w-[220px] bg-center-bg border border-border-default rounded-[var(--radius-default)] shadow-elevation-3 z-50 py-1">
                    <div className="px-2 pb-1">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search labels..."
                            className="w-full text-xs border border-border-default rounded px-2 py-1 bg-transparent outline-none focus:border-button-bg"
                            autoFocus
                        />
                    </div>

                    {/* Selected labels */}
                    {selectedOptions.length > 0 && (
                        <div className="px-2 pb-2 flex flex-wrap gap-1">
                            {selectedOptions.map((opt) => (
                                <span
                                    key={opt.id}
                                    className={cn(
                                        'text-xs px-2 py-0.5 rounded-sm font-medium inline-flex items-center gap-1',
                                        propColorMap[opt.color] || propColorMap.default
                                    )}
                                >
                                    {opt.value}
                                    <X
                                        size={10}
                                        className="cursor-pointer opacity-60 hover:opacity-100"
                                        onClick={(e) => removeOption(opt.id, e)}
                                    />
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="max-h-[200px] overflow-y-auto">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => {
                                const isSelected = currentLabels.includes(option.id)
                                return (
                                    <button
                                        key={option.id}
                                        onClick={() => toggleOption(option.id)}
                                        className={cn(
                                            'w-full text-left px-3 py-1.5 hover:bg-hover transition-colors cursor-pointer flex items-center gap-2',
                                            isSelected && 'bg-button-bg/5'
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                'w-3.5 h-3.5 rounded-sm border border-center-fg/20 flex items-center justify-center text-[10px]',
                                                isSelected && 'bg-button-bg border-button-bg text-button-fg'
                                            )}
                                        >
                                            {isSelected && '✓'}
                                        </div>
                                        <span
                                            className={cn(
                                                'text-xs px-2 py-0.5 rounded-sm font-medium',
                                                propColorMap[option.color] || propColorMap.default
                                            )}
                                        >
                                            {option.value}
                                        </span>
                                    </button>
                                )
                            })
                        ) : (
                            <div className="px-3 py-2 text-xs text-center-fg/50 text-center">No labels found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
