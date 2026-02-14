import {test, expect, describe} from 'bun:test'
import type {Card, IPropertyTemplate, ViewFields, IPropertyOption} from '../api/types'

// Extract the core grouping logic for testing (without useMemo)
function groupCards(
    cards: Card[],
    groupByProperty: IPropertyTemplate | undefined,
    viewFields?: ViewFields
) {
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
                    return Array.isArray(propValue) && propValue.includes(opt.id)
                } else {
                    return propValue === opt.id
                }
            }),
        }))

    const ungrouped = cards.filter((card) => {
        const propValue = card.fields?.properties?.[groupByProperty.id]
        if (isMultiSelectGrouping) {
            return !propValue || !Array.isArray(propValue) || propValue.length === 0
        } else {
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
}

// Mock data
const mockCards: Card[] = [
    {
        id: 'card1',
        parentId: 'board1',
        boardId: 'board1',
        createdBy: 'user1',
        modifiedBy: 'user1',
        schema: 1,
        type: 'card',
        title: 'Card 1',
        fields: {
            properties: {
                status: 'todo',
            },
        },
        createAt: Date.now(),
        updateAt: Date.now(),
        deleteAt: 0,
    },
    {
        id: 'card2',
        parentId: 'board1',
        boardId: 'board1',
        createdBy: 'user1',
        modifiedBy: 'user1',
        schema: 1,
        type: 'card',
        title: 'Card 2',
        fields: {
            properties: {
                status: 'inprogress',
            },
        },
        createAt: Date.now(),
        updateAt: Date.now(),
        deleteAt: 0,
    },
    {
        id: 'card3',
        parentId: 'board1',
        boardId: 'board1',
        createdBy: 'user1',
        modifiedBy: 'user1',
        schema: 1,
        type: 'card',
        title: 'Card 3',
        fields: {
            properties: {
                status: 'todo',
            },
        },
        createAt: Date.now(),
        updateAt: Date.now(),
        deleteAt: 0,
    },
    {
        id: 'card4',
        parentId: 'board1',
        boardId: 'board1',
        createdBy: 'user1',
        modifiedBy: 'user1',
        schema: 1,
        type: 'card',
        title: 'Card 4 (no status)',
        fields: {
            properties: {},
        },
        createAt: Date.now(),
        updateAt: Date.now(),
        deleteAt: 0,
    },
]

const mockSelectProperty: IPropertyTemplate = {
    id: 'status',
    name: 'Status',
    type: 'select',
    options: [
        {id: 'todo', value: 'To Do', color: 'gray'},
        {id: 'inprogress', value: 'In Progress', color: 'blue'},
        {id: 'done', value: 'Done', color: 'green'},
    ],
}

const mockMultiSelectProperty: IPropertyTemplate = {
    id: 'labels',
    name: 'Labels',
    type: 'multiSelect',
    options: [
        {id: 'bug', value: 'Bug', color: 'red'},
        {id: 'feature', value: 'Feature', color: 'blue'},
        {id: 'docs', value: 'Docs', color: 'green'},
    ],
}

describe('useGroupCards', () => {
    test('should return single group when no groupBy property', () => {
        const groups = groupCards(mockCards, undefined, undefined)

        expect(groups).toHaveLength(1)
        expect(groups[0]?.id).toBe('')
        expect(groups[0]?.name).toBe('No Group')
        expect(groups[0]?.cards).toHaveLength(4)
    })

    test('should group cards by select property', () => {
        const groups = groupCards(mockCards, mockSelectProperty, undefined)

        expect(groups).toHaveLength(4) // 3 options + 1 "No Value" group

        const todoGroup = groups.find((g) => g.id === 'todo')
        expect(todoGroup).toBeDefined()
        expect(todoGroup!.cards).toHaveLength(2)

        const inProgressGroup = groups.find((g) => g.id === 'inprogress')
        expect(inProgressGroup).toBeDefined()
        expect(inProgressGroup!.cards).toHaveLength(1)

        const noValueGroup = groups.find((g) => g.id === '__no_value')
        expect(noValueGroup).toBeDefined()
        expect(noValueGroup!.cards).toHaveLength(1)
        expect(noValueGroup!.cards[0]?.id).toBe('card4')
    })

    test('should respect hiddenOptionIds', () => {
        const viewFields: ViewFields = {
            viewType: 'table',
            hiddenOptionIds: ['done'],
        }

        const groups = groupCards(mockCards, mockSelectProperty, viewFields)

        expect(groups).toHaveLength(3) // Only 2 visible options + "No Value"
        expect(groups.find((g) => g.id === 'done')).toBeUndefined()
    })

    test('should respect collapsedOptionIds', () => {
        const viewFields: ViewFields = {
            viewType: 'table',
            collapsedOptionIds: ['todo'],
        }

        const groups = groupCards(mockCards, mockSelectProperty, viewFields)

        const todoGroup = groups.find((g) => g.id === 'todo')
        expect(todoGroup).toBeDefined()
        expect(todoGroup!.collapsed).toBe(true)

        const inProgressGroup = groups.find((g) => g.id === 'inprogress')
        expect(inProgressGroup).toBeDefined()
        expect(inProgressGroup!.collapsed).toBe(false)
    })

    test('should handle multiSelect grouping', () => {
        const cardsWithLabels: Card[] = [
            {
                ...mockCards[0],
                fields: {
                    properties: {
                        labels: ['bug', 'feature'],
                    },
                },
            },
            {
                ...mockCards[1],
                fields: {
                    properties: {
                        labels: ['feature'],
                    },
                },
            },
            {
                ...mockCards[2],
                fields: {
                    properties: {
                        labels: [],
                    },
                },
            },
        ]

        const groups = groupCards(cardsWithLabels, mockMultiSelectProperty, undefined)

        const bugGroup = groups.find((g) => g.id === 'bug')
        expect(bugGroup).toBeDefined()
        expect(bugGroup!.cards).toHaveLength(1) // Only card1

        const featureGroup = groups.find((g) => g.id === 'feature')
        expect(featureGroup).toBeDefined()
        expect(featureGroup!.cards).toHaveLength(2) // card1 and card2

        const noValueGroup = groups.find((g) => g.id === '__no_value')
        expect(noValueGroup).toBeDefined()
        expect(noValueGroup!.cards).toHaveLength(1) // card3 with empty array
    })
})
