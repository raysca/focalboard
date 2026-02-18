import {useState, useCallback} from 'react'

export const MAX_RECENTLY_VIEWED = 8
const STORAGE_KEY = 'focalboard:recently-viewed'

export interface RecentlyViewedEntry {
    boardId: string
    visitedAt: number
}

export function getRecentlyViewed(): RecentlyViewedEntry[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return []
        return JSON.parse(raw) as RecentlyViewedEntry[]
    } catch {
        return []
    }
}

export function addRecentlyViewed(boardId: string): void {
    const now = Date.now()
    const existing = getRecentlyViewed().filter(e => e.boardId !== boardId)
    const updated = [{boardId, visitedAt: now}, ...existing].slice(0, MAX_RECENTLY_VIEWED)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}

export function useRecentlyViewed() {
    const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedEntry[]>(getRecentlyViewed)

    const refresh = useCallback(() => {
        setRecentlyViewed(getRecentlyViewed())
    }, [])

    const trackVisit = useCallback((boardId: string) => {
        addRecentlyViewed(boardId)
        refresh()
    }, [refresh])

    return {recentlyViewed, trackVisit}
}
