import {describe, test, expect, beforeEach} from 'bun:test'

// Mock localStorage
const store: Record<string, string> = {}
const localStorageMock = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, val: string) => { store[key] = val },
    removeItem: (key: string) => { delete store[key] },
}
global.localStorage = localStorageMock as any

import {getRecentlyViewed, addRecentlyViewed, MAX_RECENTLY_VIEWED} from '../../src/frontend/hooks/useRecentlyViewed'

describe('useRecentlyViewed utilities', () => {
    beforeEach(() => {
        Object.keys(store).forEach(k => delete store[k])
    })

    test('returns empty array when no data', () => {
        expect(getRecentlyViewed()).toEqual([])
    })

    test('addRecentlyViewed stores board id with timestamp', () => {
        addRecentlyViewed('board-1')
        const recent = getRecentlyViewed()
        expect(recent.length).toBe(1)
        expect(recent[0].boardId).toBe('board-1')
        expect(typeof recent[0].visitedAt).toBe('number')
    })

    test('deduplicates boards and moves to front', () => {
        addRecentlyViewed('board-1')
        addRecentlyViewed('board-2')
        addRecentlyViewed('board-1') // revisit board-1
        const recent = getRecentlyViewed()
        expect(recent[0].boardId).toBe('board-1')
        expect(recent.filter(r => r.boardId === 'board-1').length).toBe(1)
    })

    test('caps at MAX_RECENTLY_VIEWED entries', () => {
        for (let i = 0; i < MAX_RECENTLY_VIEWED + 5; i++) {
            addRecentlyViewed(`board-${i}`)
        }
        expect(getRecentlyViewed().length).toBe(MAX_RECENTLY_VIEWED)
    })
})
