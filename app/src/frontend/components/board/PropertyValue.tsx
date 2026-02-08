import React from 'react'
import {cn} from '../../lib/cn'
import {useUsersByIdsQuery, getUserDisplay} from '../../hooks/useUsers'
import type {IPropertyTemplate, IPropertyOption} from '../../api/types'

interface PropertyValueProps {
    template: IPropertyTemplate
    value: any
    className?: string
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

export function PropertyValue({template, value, className}: PropertyValueProps) {
    if (value === undefined || value === null || value === '') return null

    switch (template.type) {
        case 'select': {
            const option = template.options?.find((o: IPropertyOption) => o.id === value)
            if (!option) return null
            const colorClass = propColorMap[option.color] || propColorMap.default
            return (
                <span className={cn('text-xs px-2 py-0.5 rounded-sm font-medium', colorClass, className)}>
                    {option.value}
                </span>
            )
        }

        case 'multiSelect': {
            const values = Array.isArray(value) ? value : [value]
            return (
                <div className={cn('flex flex-wrap gap-1', className)}>
                    {values.map((v: string) => {
                        const option = template.options?.find((o: IPropertyOption) => o.id === v)
                        if (!option) return null
                        const colorClass = propColorMap[option.color] || propColorMap.default
                        return (
                            <span key={v} className={cn('text-xs px-2 py-0.5 rounded-sm font-medium', colorClass)}>
                                {option.value}
                            </span>
                        )
                    })}
                </div>
            )
        }

        case 'checkbox': {
            return (
                <span className={cn('text-sm', className)}>
                    {value === 'true' ? '✅' : '⬜'}
                </span>
            )
        }

        case 'date': {
            try {
                const dateObj = JSON.parse(value)
                const from = dateObj.from ? new Date(dateObj.from).toLocaleDateString() : ''
                const to = dateObj.to ? new Date(dateObj.to).toLocaleDateString() : ''
                return (
                    <span className={cn('text-xs text-center-fg/70', className)}>
                        {from}{to ? ` → ${to}` : ''}
                    </span>
                )
            } catch {
                return <span className={cn('text-xs text-center-fg/70', className)}>{String(value)}</span>
            }
        }

        case 'url': {
            return (
                <a
                    href={String(value)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn('text-xs text-link hover:underline', className)}
                    onClick={(e) => e.stopPropagation()}
                >
                    {String(value)}
                </a>
            )
        }

        case 'person': {
            return <PersonValue userId={String(value)} className={className} />
        }

        default:
            return (
                <span className={cn('text-xs text-center-fg/70', className)}>
                    {String(value)}
                </span>
            )
    }
}

function PersonValue({userId, className}: {userId: string; className?: string}) {
    const {data: users} = useUsersByIdsQuery([userId])
    const user = users?.[0]

    if (!user) {
        return (
            <span className={cn('text-xs text-center-fg/70', className)}>
                {userId.slice(0, 8)}...
            </span>
        )
    }

    const display = getUserDisplay(user)
    return (
        <span className={cn('inline-flex items-center gap-1', className)}>
            <span className="w-4 h-4 rounded-full bg-button-bg/20 flex items-center justify-center text-[8px] font-bold text-button-bg shrink-0">
                {display.initials}
            </span>
            <span className="text-xs text-center-fg/70">{display.name}</span>
        </span>
    )
}
