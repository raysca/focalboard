/**
 * useBoardWebSocket - Board-specific WebSocket subscription
 *
 * Auto-subscribes to a board's real-time events when the board is active.
 * Automatically cleans up subscription when board changes or component unmounts.
 *
 * Usage:
 * const { isConnected } = useBoardWebSocket(boardId)
 */

import { useEffect } from 'react'
import { useWebSocket } from './useWebSocket'

export function useBoardWebSocket(boardId: string | undefined) {
    const { subscribe, unsubscribe, isConnected } = useWebSocket()

    useEffect(() => {
        if (!boardId) return

        // Subscribe to board events
        subscribe('board', boardId)

        // Cleanup: unsubscribe when board changes or component unmounts
        return () => {
            unsubscribe('board', boardId)
        }
    }, [boardId, subscribe, unsubscribe])

    return { isConnected }
}
