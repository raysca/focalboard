import React, {useState, useRef, useEffect, useCallback} from 'react'
import {X, Plus, ChevronDown} from 'lucide-react'
import {cn} from '../../lib/cn'
import {
    filterValueTypeForProperty,
    conditionsForValueType,
    conditionNeedsValue,
    createFilterClause,
} from '../../lib/cardFilter'
import type {IPropertyTemplate, FilterGroup, FilterClause} from '../../api/types'

interface FilterComponentProps {
    open: boolean
    onClose: () => void
    properties: IPropertyTemplate[]
    filterGroup: FilterGroup
    onChange: (filterGroup: FilterGroup) => void
}

export function FilterComponent({open, onClose, properties, filterGroup, onChange}: FilterComponentProps) {
    const panelRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return
        const handleClick = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                onClose()
            }
        }
        // Delay to avoid the trigger click from immediately closing
        const timer = setTimeout(() => document.addEventListener('mousedown', handleClick), 0)
        return () => {
            clearTimeout(timer)
            document.removeEventListener('mousedown', handleClick)
        }
    }, [open, onClose])

    const handleAddFilter = useCallback(() => {
        // Pick first filterable property that isn't already used
        const usedIds = new Set(filterGroup.filters.map((f) => f.propertyId))
        const available = properties.filter((p) => !usedIds.has(p.id) && filterValueTypeForProperty(p.type) !== 'none')
        const target = available[0] || properties[0]
        if (!target) return

        const newClause = createFilterClause(target.id, target)
        onChange({
            ...filterGroup,
            filters: [...filterGroup.filters, newClause],
        })
    }, [filterGroup, properties, onChange])

    const handleUpdateFilter = useCallback((index: number, updated: FilterClause) => {
        const filters = [...filterGroup.filters]
        filters[index] = updated
        onChange({...filterGroup, filters})
    }, [filterGroup, onChange])

    const handleRemoveFilter = useCallback((index: number) => {
        const filters = filterGroup.filters.filter((_, i) => i !== index)
        onChange({...filterGroup, filters})
    }, [filterGroup, onChange])

    const handleToggleOperation = useCallback(() => {
        onChange({
            ...filterGroup,
            operation: filterGroup.operation === 'and' ? 'or' : 'and',
        })
    }, [filterGroup, onChange])

    if (!open) return null

    return (
        <div
            ref={panelRef}
            className="absolute top-full left-0 mt-1 z-50 bg-center-bg border border-border-default rounded-lg shadow-elevation-3 min-w-[520px] max-w-[680px]"
        >
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-default">
                <span className="text-xs font-semibold text-center-fg/50 uppercase tracking-wider">Filters</span>
                <button
                    onClick={onClose}
                    className="p-1 rounded hover:bg-hover text-center-fg/40 hover:text-center-fg transition-colors cursor-pointer"
                >
                    <X size={14} />
                </button>
            </div>

            <div className="p-3 space-y-2">
                {filterGroup.filters.length === 0 && (
                    <div className="text-xs text-center-fg/40 py-3 text-center">
                        No filters applied. Add a filter to narrow down cards.
                    </div>
                )}

                {filterGroup.filters.map((clause, index) => (
                    <FilterRow
                        key={`${clause.propertyId}-${index}`}
                        clause={clause}
                        index={index}
                        properties={properties}
                        operation={filterGroup.operation}
                        showOperator={index > 0}
                        onToggleOperation={handleToggleOperation}
                        onChange={(updated) => handleUpdateFilter(index, updated)}
                        onRemove={() => handleRemoveFilter(index)}
                    />
                ))}
            </div>

            <div className="px-3 pb-3">
                <button
                    onClick={handleAddFilter}
                    className="flex items-center gap-1.5 text-xs text-button-bg hover:text-button-hover font-medium px-2 py-1.5 rounded hover:bg-button-bg/5 transition-colors cursor-pointer"
                >
                    <Plus size={12} />
                    <span>Add filter</span>
                </button>
            </div>
        </div>
    )
}

/* ─── Individual filter row ─── */

interface FilterRowProps {
    clause: FilterClause
    index: number
    properties: IPropertyTemplate[]
    operation: 'and' | 'or'
    showOperator: boolean
    onToggleOperation: () => void
    onChange: (updated: FilterClause) => void
    onRemove: () => void
}

function FilterRow({clause, index, properties, operation, showOperator, onToggleOperation, onChange, onRemove}: FilterRowProps) {
    const template = properties.find((p) => p.id === clause.propertyId)
    const valueType = template ? filterValueTypeForProperty(template.type) : 'options'
    const conditions = conditionsForValueType(valueType)
    const needsValue = conditionNeedsValue(clause.condition)

    const handlePropertyChange = (newPropertyId: string) => {
        const newTemplate = properties.find((p) => p.id === newPropertyId)
        const newClause = createFilterClause(newPropertyId, newTemplate)
        onChange(newClause)
    }

    return (
        <div className="flex items-center gap-1.5">
            {/* And/Or operator */}
            <div className="w-12 flex-shrink-0 text-right">
                {showOperator ? (
                    <button
                        onClick={onToggleOperation}
                        className="text-xs font-medium text-button-bg hover:text-button-hover cursor-pointer px-1 py-0.5 rounded hover:bg-button-bg/5 transition-colors"
                    >
                        {operation === 'and' ? 'and' : 'or'}
                    </button>
                ) : (
                    <span className="text-xs text-center-fg/40">where</span>
                )}
            </div>

            {/* Property selector */}
            <PropertyDropdown
                value={clause.propertyId}
                properties={properties}
                onChange={handlePropertyChange}
            />

            {/* Condition selector */}
            <ConditionDropdown
                value={clause.condition}
                conditions={conditions}
                onChange={(condition) => onChange({...clause, condition, values: conditionNeedsValue(condition) ? clause.values : []})}
            />

            {/* Value input */}
            {needsValue && (
                <FilterValueInput
                    clause={clause}
                    template={template}
                    valueType={valueType}
                    onChange={onChange}
                />
            )}

            {/* Spacer to push delete right */}
            {!needsValue && <div className="flex-1" />}

            {/* Remove button */}
            <button
                onClick={onRemove}
                className="p-1.5 rounded hover:bg-red-500/10 text-center-fg/30 hover:text-red-500 transition-colors cursor-pointer flex-shrink-0"
                title="Remove filter"
            >
                <X size={12} />
            </button>
        </div>
    )
}

/* ─── Property dropdown ─── */

function PropertyDropdown({value, properties, onChange}: {
    value: string
    properties: IPropertyTemplate[]
    onChange: (id: string) => void
}) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    const current = properties.find((p) => p.id === value)

    useEffect(() => {
        if (!open) return
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [open])

    // Include __title as a pseudo-property
    const titleOption = {id: '__title', name: 'Title', type: 'text' as const, options: []}

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1 h-7 px-2.5 rounded border border-border-default bg-center-bg text-xs text-center-fg hover:border-center-fg/30 transition-colors cursor-pointer min-w-[100px]"
            >
                <span className="truncate">{value === '__title' ? 'Title' : (current?.name || 'Select...')}</span>
                <ChevronDown size={10} className="text-center-fg/40 flex-shrink-0" />
            </button>
            {open && (
                <div className="absolute top-full left-0 mt-1 z-50 bg-center-bg border border-border-default rounded-md shadow-elevation-3 py-1 min-w-[160px]">
                    <button
                        key="__title"
                        onClick={() => { onChange('__title'); setOpen(false) }}
                        className={cn(
                            'w-full text-left px-3 py-1.5 text-xs hover:bg-hover transition-colors cursor-pointer',
                            value === '__title' && 'bg-button-bg/10 text-button-bg font-medium',
                        )}
                    >
                        Title
                    </button>
                    {properties.filter((p) => filterValueTypeForProperty(p.type) !== 'none').map((p) => (
                        <button
                            key={p.id}
                            onClick={() => { onChange(p.id); setOpen(false) }}
                            className={cn(
                                'w-full text-left px-3 py-1.5 text-xs hover:bg-hover transition-colors cursor-pointer',
                                value === p.id && 'bg-button-bg/10 text-button-bg font-medium',
                            )}
                        >
                            {p.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

/* ─── Condition dropdown ─── */

function ConditionDropdown({value, conditions, onChange}: {
    value: string
    conditions: {value: string; label: string}[]
    onChange: (condition: string) => void
}) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    const current = conditions.find((c) => c.value === value)

    useEffect(() => {
        if (!open) return
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [open])

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1 h-7 px-2.5 rounded border border-border-default bg-center-bg text-xs text-center-fg hover:border-center-fg/30 transition-colors cursor-pointer min-w-[110px]"
            >
                <span className="truncate">{current?.label || value}</span>
                <ChevronDown size={10} className="text-center-fg/40 flex-shrink-0" />
            </button>
            {open && (
                <div className="absolute top-full left-0 mt-1 z-50 bg-center-bg border border-border-default rounded-md shadow-elevation-3 py-1 min-w-[160px]">
                    {conditions.map((c) => (
                        <button
                            key={c.value}
                            onClick={() => { onChange(c.value); setOpen(false) }}
                            className={cn(
                                'w-full text-left px-3 py-1.5 text-xs hover:bg-hover transition-colors cursor-pointer',
                                value === c.value && 'bg-button-bg/10 text-button-bg font-medium',
                            )}
                        >
                            {c.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

/* ─── Value input (adapts to property type) ─── */

function FilterValueInput({clause, template, valueType, onChange}: {
    clause: FilterClause
    template?: IPropertyTemplate
    valueType: string
    onChange: (updated: FilterClause) => void
}) {
    if (valueType === 'options' && template) {
        return (
            <OptionsValuePicker
                options={template.options || []}
                selectedIds={clause.values}
                onChange={(values) => onChange({...clause, values})}
            />
        )
    }

    if (valueType === 'date') {
        return (
            <input
                type="date"
                value={clause.values[0] || ''}
                onChange={(e) => onChange({...clause, values: [e.target.value]})}
                className="h-7 px-2 rounded border border-border-default bg-center-bg text-xs text-center-fg focus:outline-none focus:border-button-bg transition-colors min-w-[130px]"
            />
        )
    }

    // Default: text input
    return (
        <input
            type="text"
            value={clause.values[0] || ''}
            onChange={(e) => onChange({...clause, values: [e.target.value]})}
            placeholder="value..."
            className="h-7 px-2.5 flex-1 rounded border border-border-default bg-center-bg text-xs text-center-fg placeholder:text-center-fg/30 focus:outline-none focus:border-button-bg transition-colors min-w-[100px]"
        />
    )
}

/* ─── Options value picker (for select/multiSelect) ─── */

const propColorDots: Record<string, string> = {
    default: 'bg-[#8c8c8c]',
    gray: 'bg-[#8c8c8c]',
    brown: 'bg-[#91683f]',
    orange: 'bg-[#d97706]',
    yellow: 'bg-[#ca8a04]',
    green: 'bg-[#16a34a]',
    blue: 'bg-[#2563eb]',
    purple: 'bg-[#7c3aed]',
    pink: 'bg-[#db2777]',
    red: 'bg-[#dc2626]',
}

function OptionsValuePicker({options, selectedIds, onChange}: {
    options: {id: string; value: string; color: string}[]
    selectedIds: string[]
    onChange: (ids: string[]) => void
}) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [open])

    const toggleOption = (id: string) => {
        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter((v) => v !== id))
        } else {
            onChange([...selectedIds, id])
        }
    }

    const selectedLabels = options
        .filter((o) => selectedIds.includes(o.id))
        .map((o) => o.value)

    return (
        <div ref={ref} className="relative flex-1">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1 h-7 px-2.5 w-full rounded border border-border-default bg-center-bg text-xs text-center-fg hover:border-center-fg/30 transition-colors cursor-pointer min-w-[100px]"
            >
                <span className="truncate flex-1 text-left">
                    {selectedLabels.length > 0 ? selectedLabels.join(', ') : <span className="text-center-fg/30">Select options...</span>}
                </span>
                <ChevronDown size={10} className="text-center-fg/40 flex-shrink-0" />
            </button>
            {open && (
                <div className="absolute top-full left-0 mt-1 z-50 bg-center-bg border border-border-default rounded-md shadow-elevation-3 py-1 min-w-[180px] max-h-[200px] overflow-auto">
                    {options.map((opt) => {
                        const selected = selectedIds.includes(opt.id)
                        const dotClass = propColorDots[opt.color] || propColorDots.default
                        return (
                            <button
                                key={opt.id}
                                onClick={() => toggleOption(opt.id)}
                                className={cn(
                                    'w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-hover transition-colors cursor-pointer',
                                    selected && 'bg-button-bg/5',
                                )}
                            >
                                <div className={cn(
                                    'w-3.5 h-3.5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                                    selected ? 'border-button-bg bg-button-bg' : 'border-center-fg/20',
                                )}>
                                    {selected && (
                                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                            <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </div>
                                <div className={cn('w-2 h-2 rounded-full flex-shrink-0', dotClass)} />
                                <span className="truncate">{opt.value}</span>
                            </button>
                        )
                    })}
                    {options.length === 0 && (
                        <div className="px-3 py-2 text-xs text-center-fg/40">No options available</div>
                    )}
                </div>
            )}
        </div>
    )
}
