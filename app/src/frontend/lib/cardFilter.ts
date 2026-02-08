import type {Card, IPropertyTemplate, FilterGroup, FilterClause} from '../api/types'

/**
 * Supported filter conditions per property value type.
 */
export type FilterValueType = 'none' | 'options' | 'text' | 'boolean' | 'date'

export function filterValueTypeForProperty(type: string): FilterValueType {
    switch (type) {
        case 'select':
        case 'multiSelect':
            return 'options'
        case 'checkbox':
            return 'boolean'
        case 'text':
        case 'url':
        case 'email':
        case 'phone':
        case 'number':
            return 'text'
        case 'date':
        case 'createdTime':
        case 'updatedTime':
            return 'date'
        default:
            return 'none'
    }
}

export function conditionsForValueType(valueType: FilterValueType): {value: string; label: string}[] {
    switch (valueType) {
        case 'options':
            return [
                {value: 'includes', label: 'includes'},
                {value: 'notIncludes', label: 'does not include'},
                {value: 'isEmpty', label: 'is empty'},
                {value: 'isNotEmpty', label: 'is not empty'},
            ]
        case 'text':
            return [
                {value: 'contains', label: 'contains'},
                {value: 'notContains', label: 'does not contain'},
                {value: 'is', label: 'is'},
                {value: 'startsWith', label: 'starts with'},
                {value: 'endsWith', label: 'ends with'},
                {value: 'isEmpty', label: 'is empty'},
                {value: 'isNotEmpty', label: 'is not empty'},
            ]
        case 'boolean':
            return [
                {value: 'isSet', label: 'is checked'},
                {value: 'isNotSet', label: 'is not checked'},
            ]
        case 'date':
            return [
                {value: 'is', label: 'is'},
                {value: 'isBefore', label: 'is before'},
                {value: 'isAfter', label: 'is after'},
                {value: 'isSet', label: 'is set'},
                {value: 'isNotSet', label: 'is not set'},
            ]
        default:
            return []
    }
}

/**
 * Returns the default condition for a given value type.
 */
export function defaultCondition(valueType: FilterValueType): string {
    switch (valueType) {
        case 'options': return 'includes'
        case 'text': return 'contains'
        case 'boolean': return 'isSet'
        case 'date': return 'isSet'
        default: return 'includes'
    }
}

/**
 * Whether a condition needs a value input (vs. being unary like isEmpty).
 */
export function conditionNeedsValue(condition: string): boolean {
    return !['isEmpty', 'isNotEmpty', 'isSet', 'isNotSet'].includes(condition)
}

/**
 * Apply a full FilterGroup to an array of cards. Returns the filtered cards.
 */
export function applyFilterGroup(
    filterGroup: FilterGroup | undefined,
    templates: IPropertyTemplate[],
    cards: Card[],
): Card[] {
    if (!filterGroup || !filterGroup.filters || filterGroup.filters.length === 0) {
        return cards
    }

    return cards.filter((card) => {
        const results = filterGroup.filters.map((clause) =>
            isClauseMet(clause, templates, card),
        )

        if (filterGroup.operation === 'or') {
            return results.some(Boolean)
        }
        // Default: 'and'
        return results.every(Boolean)
    })
}

/**
 * Evaluate a single FilterClause against a card.
 */
function isClauseMet(
    clause: FilterClause,
    templates: IPropertyTemplate[],
    card: Card,
): boolean {
    const {propertyId, condition, values} = clause

    // Special handling: filter by card title
    if (propertyId === '__title') {
        return isTextConditionMet(condition, card.title || '', values)
    }

    const template = templates.find((t) => t.id === propertyId)
    if (!template) return true // unknown property → pass through

    const rawValue = card.fields?.properties?.[propertyId]
    const valueType = filterValueTypeForProperty(template.type)

    switch (valueType) {
        case 'options':
            return isOptionsConditionMet(condition, rawValue, values)
        case 'text':
            return isTextConditionMet(condition, String(rawValue || ''), values)
        case 'boolean':
            return isBooleanConditionMet(condition, rawValue)
        case 'date':
            return isDateConditionMet(condition, rawValue, values)
        default:
            return true
    }
}

function isOptionsConditionMet(condition: string, rawValue: any, filterValues: string[]): boolean {
    // rawValue can be a string (select) or array (multiSelect)
    const cardValues = Array.isArray(rawValue) ? rawValue : (rawValue ? [rawValue] : [])

    switch (condition) {
        case 'includes':
            if (filterValues.length === 0) return true
            return filterValues.some((fv) => cardValues.includes(fv))
        case 'notIncludes':
            if (filterValues.length === 0) return true
            return !filterValues.some((fv) => cardValues.includes(fv))
        case 'isEmpty':
            return cardValues.length === 0
        case 'isNotEmpty':
            return cardValues.length > 0
        default:
            return true
    }
}

function isTextConditionMet(condition: string, cardValue: string, filterValues: string[]): boolean {
    const text = cardValue.toLowerCase()
    const filterText = (filterValues[0] || '').toLowerCase()

    switch (condition) {
        case 'is':
            if (!filterText) return true
            return text === filterText
        case 'contains':
            if (!filterText) return true
            return text.includes(filterText)
        case 'notContains':
            if (!filterText) return true
            return !text.includes(filterText)
        case 'startsWith':
            if (!filterText) return true
            return text.startsWith(filterText)
        case 'endsWith':
            if (!filterText) return true
            return text.endsWith(filterText)
        case 'isEmpty':
            return text.length === 0
        case 'isNotEmpty':
            return text.length > 0
        default:
            return true
    }
}

function isBooleanConditionMet(condition: string, rawValue: any): boolean {
    const isChecked = rawValue === 'true' || rawValue === true

    switch (condition) {
        case 'isSet':
            return isChecked
        case 'isNotSet':
            return !isChecked
        default:
            return true
    }
}

function isDateConditionMet(condition: string, rawValue: any, filterValues: string[]): boolean {
    switch (condition) {
        case 'isSet':
            return !!rawValue
        case 'isNotSet':
            return !rawValue
        case 'is':
        case 'isBefore':
        case 'isAfter': {
            if (!rawValue || !filterValues[0]) return true
            try {
                let cardDate: number
                // Date values can be JSON { from: "..." } or plain ISO strings
                if (typeof rawValue === 'string' && rawValue.startsWith('{')) {
                    const parsed = JSON.parse(rawValue)
                    cardDate = new Date(parsed.from || rawValue).getTime()
                } else {
                    cardDate = new Date(rawValue).getTime()
                }
                const filterDate = new Date(filterValues[0]).getTime()
                if (isNaN(cardDate) || isNaN(filterDate)) return true

                if (condition === 'is') return cardDate === filterDate
                if (condition === 'isBefore') return cardDate < filterDate
                if (condition === 'isAfter') return cardDate > filterDate
            } catch {
                return true
            }
            return true
        }
        default:
            return true
    }
}

/**
 * Creates an empty filter clause for a given property.
 */
export function createFilterClause(propertyId: string, template?: IPropertyTemplate): FilterClause {
    const valueType = template ? filterValueTypeForProperty(template.type) : 'options'
    return {
        propertyId,
        condition: defaultCondition(valueType),
        values: [],
    }
}
