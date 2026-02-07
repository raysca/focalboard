import React, {useState, useRef, useEffect} from 'react'
import {X} from 'lucide-react'
import {cn} from '../../../lib/cn'
import type {IPropertyTemplate, IPropertyOption} from '../../../api/types'

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

interface MultiSelectPropertyEditorProps {
    template: IPropertyTemplate
    value: string[]
    onChange: (value: string[]) => void
}

export function MultiSelectPropertyEditor({template, value = [], onChange}: MultiSelectPropertyEditorProps) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const containerRef = useRef<HTMLDivElement>(null)

    const selectedOptions = (template.options || []).filter((o) => value.includes(o.id))

    useEffect(() => {
        if (!open) return
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [open])

    const filteredOptions = (template.options || []).filter((o) =>
        o.value.toLowerCase().includes(search.toLowerCase())
    )

    const toggleOption = (optionId: string) => {
        if (value.includes(optionId)) {
            onChange(value.filter((v) => v !== optionId))
        } else {
            onChange([...value, optionId])
        }
    }

    const removeOption = (optionId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        onChange(value.filter((v) => v !== optionId))
    }

    return (
        <div ref={containerRef} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center flex-wrap gap-1 min-h-[28px] px-1 rounded hover:bg-hover transition-colors cursor-pointer"
            >
                {selectedOptions.length > 0 ? (
                    selectedOptions.map((opt) => (
                        <span key={opt.id} className={cn('text-xs px-2 py-0.5 rounded-sm font-medium inline-flex items-center gap-1', propColorMap[opt.color] || propColorMap.default)}>
                            {opt.value}
                            <X size={10} className="cursor-pointer opacity-60 hover:opacity-100" onClick={(e) => removeOption(opt.id, e)} />
                        </span>
                    ))
                ) : (
                    <span className="text-xs text-center-fg/30">Select...</span>
                )}
            </button>

            {open && (
                <div className="absolute top-full left-0 mt-1 w-[200px] bg-center-bg border border-border-default rounded-[var(--radius-default)] shadow-elevation-3 z-50 py-1">
                    <div className="px-2 pb-1">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search..."
                            className="w-full text-xs border border-border-default rounded px-2 py-1 bg-transparent outline-none focus:border-button-bg"
                            autoFocus
                        />
                    </div>
                    <div className="max-h-[200px] overflow-y-auto">
                        {filteredOptions.map((option) => {
                            const isSelected = value.includes(option.id)
                            return (
                                <button
                                    key={option.id}
                                    onClick={() => toggleOption(option.id)}
                                    className={cn(
                                        'w-full text-left px-3 py-1.5 hover:bg-hover transition-colors cursor-pointer flex items-center gap-2',
                                        isSelected && 'bg-button-bg/5'
                                    )}
                                >
                                    <div className={cn('w-3.5 h-3.5 rounded-sm border border-center-fg/20 flex items-center justify-center text-[10px]', isSelected && 'bg-button-bg border-button-bg text-button-fg')}>
                                        {isSelected && '✓'}
                                    </div>
                                    <span className={cn('text-xs px-2 py-0.5 rounded-sm font-medium', propColorMap[option.color] || propColorMap.default)}>
                                        {option.value}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
