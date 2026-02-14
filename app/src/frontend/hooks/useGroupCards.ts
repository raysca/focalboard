import {useMemo} from 'react'
import type {Card, IPropertyTemplate, IPropertyOption, ViewFields} from '../api/types'

export interface Group {
    id: string
    name: string
    color: string
    cards: Card[]
    collapsed: boolean
}

export function useGroupCards(
    cards: Card[],
    groupByProperty: IPropertyTemplate | undefined,
    viewFields?: ViewFields
): Group[] {
    return useMemo(() => {
        if (!groupByProperty || !groupByProperty.options) {
            return [{id: '', name: 'No Group', color: 'default', cards, collapsed: false}]
        }

        const collapsedIds = new Set(viewFields?.collapsedOptionIds || [])
        const hiddenIds = new Set(viewFields?.hiddenOptionIds || [])
        const isMultiSelectGrouping = groupByProperty.type === 'multiSelect'

        const optionGroups = groupByProperty.options
            .filter((opt: IPropertyOption) => !hiddenIds.has(opt.id))
            .map((opt: IPropertyOption) => ({
                id: opt.id,
                name: opt.value,
                color: opt.color,
                collapsed: collapsedIds.has(opt.id),
                cards: cards.filter((card) => {
                    const propValue = card.fields?.properties?.[groupByProperty.id]
                    if (isMultiSelectGrouping) {
                        // For multiSelect: check if array includes this option
                        return Array.isArray(propValue) && propValue.includes(opt.id)
                    } else {
                        // For select: check exact match
                        return propValue === opt.id
                    }
                }),
            }))

        // Add "No Value" group for cards without the property
        const ungrouped = cards.filter((card) => {
            const propValue = card.fields?.properties?.[groupByProperty.id]
            if (isMultiSelectGrouping) {
                // For multiSelect: cards with empty array or no value
                return !propValue || !Array.isArray(propValue) || propValue.length === 0
            } else {
                // For select: cards without value
                return !propValue || !groupByProperty.options?.some((o: IPropertyOption) => o.id === propValue)
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
    }, [cards, groupByProperty, viewFields])
}
