import React, {useState, useRef, useEffect} from 'react'
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

interface SelectPropertyEditorProps {
    template: IPropertyTemplate
    value: string
    onChange: (value: string) => void
}

export function SelectPropertyEditor({template, value, onChange}: SelectPropertyEditorProps) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const containerRef = useRef<HTMLDivElement>(null)

    const selectedOption = template.options?.find((o) => o.id === value)

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

    return (
        <div ref={containerRef} className="relative">
            {/* Current value display */}
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center min-h-[28px] px-1 rounded hover:bg-hover transition-colors cursor-pointer"
            >
                {selectedOption ? (
                    <span className={cn('text-xs px-2 py-0.5 rounded-sm font-medium', propColorMap[selectedOption.color] || propColorMap.default)}>
                        {selectedOption.value}
                    </span>
                ) : (
                    <span className="text-xs text-center-fg/30">Select...</span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute top-full left-0 mt-1 w-[200px] bg-center-bg border border-border-default rounded-[var(--radius-default)] shadow-elevation-3 z-50 py-1">
                    {/* Search */}
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

                    {/* Clear option */}
                    {value && (
                        <button
                            onClick={() => { onChange(''); setOpen(false) }}
                            className="w-full text-left px-3 py-1.5 text-xs text-center-fg/50 hover:bg-hover transition-colors cursor-pointer"
                        >
                            Clear
                        </button>
                    )}

                    {/* Options */}
                    <div className="max-h-[200px] overflow-y-auto">
                        {filteredOptions.map((option) => (
                            <button
                                key={option.id}
                                onClick={() => { onChange(option.id); setOpen(false); setSearch('') }}
                                className={cn(
                                    'w-full text-left px-3 py-1.5 hover:bg-hover transition-colors cursor-pointer flex items-center gap-2',
                                    option.id === value && 'bg-button-bg/5'
                                )}
                            >
                                <span className={cn('text-xs px-2 py-0.5 rounded-sm font-medium', propColorMap[option.color] || propColorMap.default)}>
                                    {option.value}
                                </span>
                            </button>
                        ))}
                        {filteredOptions.length === 0 && (
                            <div className="px-3 py-2 text-xs text-center-fg/30">No options</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
