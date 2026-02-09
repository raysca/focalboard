/**
 * useWebSocket - Core WebSocket connection hook
 *
 * Provides real-time communication with the backend via WebSocket.
 * Features:
 * - Auto-reconnection on disconnect
 * - TanStack Query invalidation on events
 * - Subscribe/unsubscribe to board/user scopes
 * - Heartbeat (ping/pong)
 *
 * Usage:
 * const { isConnected, subscribe, unsubscribe } = useWebSocket()
 * subscribe('board', 'board-123')
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'

/**
 * Event types from backend
 */
type EventType =
    | 'board.created'
    | 'board.updated'
    | 'board.deleted'
    | 'block.created'
    | 'block.updated'
    | 'block.deleted'
    | 'comment.created'
    | 'member.added'
    | 'member.removed'

type EventScope = 'board' | 'user' | 'team' | 'global'

interface Event {
    id: string
    type: EventType
    scope: EventScope
    timestamp: number
    actor: {
        userId: string
        username?: string
    }
    meta: {
        boardId?: string
        teamId?: string
        blockId?: string
    }
    entity?: {
        type: string
        id: string
    }
    changes?: {
        before: unknown
        after: unknown
    }
}

/**
 * Server → Client message types
 */
type ServerMessage =
    | { type: 'event'; event: Event }
    | { type: 'error'; code: string; message: string }
    | { type: 'pong'; timestamp: number }
    | { type: 'ack'; success: boolean }
    | { type: 'connected'; userId: string }

/**
 * Client → Server message types
 */
type ClientMessage =
    | { type: 'subscribe'; scope: EventScope; id: string }
    | { type: 'unsubscribe'; scope: EventScope; id: string }
    | { type: 'ping' }

interface UseWebSocketOptions {
    onEvent?: (event: Event) => void
    onError?: (error: Error) => void
    onConnect?: () => void
    onDisconnect?: () => void
    reconnectDelay?: number
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
    const [isConnected, setIsConnected] = useState(false)
    const wsRef = useRef<WebSocket | null>(null)
    const reconnectTimerRef = useRef<number | null>(null)
    const queryClient = useQueryClient()

    /**
     * Handle incoming events and invalidate TanStack Query cache
     */
    const handleEvent = useCallback((event: Event) => {
        console.log('[WebSocket] Event received:', event.type, event.meta)

        // Auto-invalidate queries based on event type
        switch (event.type) {
            case 'board.created':
            case 'board.updated':
            case 'board.deleted':
                // Invalidate board-specific queries
                if (event.meta.boardId) {
                    queryClient.invalidateQueries({
                        queryKey: ['board', event.meta.boardId]
                    })
                }
                // Invalidate board lists
                queryClient.invalidateQueries({
                    queryKey: ['boards']
                })
                break

            case 'block.created':
            case 'block.updated':
            case 'block.deleted':
            case 'block.moved':
            case 'comment.created':
            case 'comment.updated':
            case 'comment.deleted':
                // Invalidate blocks for the board
                if (event.meta.boardId) {
                    queryClient.invalidateQueries({
                        queryKey: ['blocks', event.meta.boardId]
                    })
                }
                // Invalidate specific block
                if (event.meta.blockId) {
                    queryClient.invalidateQueries({
                        queryKey: ['block', event.meta.blockId]
                    })
                }
                // For moved blocks, also invalidate old board if different
                if (event.type === 'block.moved' && event.meta.oldBoardId && event.meta.oldBoardId !== event.meta.boardId) {
                    queryClient.invalidateQueries({
                        queryKey: ['blocks', event.meta.oldBoardId]
                    })
                }
                break

            case 'member.added':
            case 'member.removed':
                // Invalidate members list
                if (event.meta.boardId) {
                    queryClient.invalidateQueries({
                        queryKey: ['members', event.meta.boardId]
                    })
                }
                break
        }

        // Call custom handler
        options.onEvent?.(event)
    }, [queryClient, options.onEvent])

    /**
     * Connect to WebSocket
     */
    const connect = useCallback(() => {
        // Clear any pending reconnect
        if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current)
            reconnectTimerRef.current = null
        }

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        // WebSocket will use cookies automatically for authentication
        const ws = new WebSocket(`${protocol}//${window.location.host}/api/v2/ws`)

        ws.onopen = () => {
            console.log('[WebSocket] Connected')
            setIsConnected(true)
            wsRef.current = ws
            options.onConnect?.()
        }

        ws.onmessage = (event) => {
            try {
                const message: ServerMessage = JSON.parse(event.data)

                switch (message.type) {
                    case 'connected':
                        console.log('[WebSocket] Authenticated as:', message.userId)
                        break
                    case 'event':
                        handleEvent(message.event)
                        break
                    case 'error':
                        console.error('[WebSocket] Error:', message.code, message.message)
                        options.onError?.(new Error(message.message))
                        break
                    case 'pong':
                        // Heartbeat response
                        break
                    case 'ack':
                        // Subscription acknowledgment
                        break
                }
            } catch (error) {
                console.error('[WebSocket] Error parsing message:', error)
            }
        }

        ws.onerror = (error) => {
            console.error('[WebSocket] Connection error:', error)
            options.onError?.(new Error('WebSocket error'))
        }

        ws.onclose = () => {
            console.log('[WebSocket] Disconnected')
            setIsConnected(false)
            wsRef.current = null
            options.onDisconnect?.()

            // Reconnect after delay
            const delay = options.reconnectDelay ?? 3000
            reconnectTimerRef.current = window.setTimeout(() => {
                console.log('[WebSocket] Reconnecting...')
                connect()
            }, delay)
        }

        wsRef.current = ws
    }, [options, handleEvent])

    /**
     * Subscribe to events
     */
    const subscribe = useCallback((scope: EventScope, id: string) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            console.warn('[WebSocket] Cannot subscribe - not connected')
            return
        }

        const message: ClientMessage = {
            type: 'subscribe',
            scope,
            id
        }

        wsRef.current.send(JSON.stringify(message))
        console.log('[WebSocket] Subscribed to:', scope, id)
    }, [])

    /**
     * Unsubscribe from events
     */
    const unsubscribe = useCallback((scope: EventScope, id: string) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            return
        }

        const message: ClientMessage = {
            type: 'unsubscribe',
            scope,
            id
        }

        wsRef.current.send(JSON.stringify(message))
        console.log('[WebSocket] Unsubscribed from:', scope, id)
    }, [])

    /**
     * Send ping (heartbeat)
     */
    const ping = useCallback(() => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            return
        }

        const message: ClientMessage = { type: 'ping' }
        wsRef.current.send(JSON.stringify(message))
    }, [])

    /**
     * Setup WebSocket connection on mount
     */
    useEffect(() => {
        connect()

        // Heartbeat interval (every 30 seconds)
        const heartbeatInterval = setInterval(() => {
            ping()
        }, 30000)

        return () => {
            // Cleanup on unmount
            clearInterval(heartbeatInterval)

            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current)
            }

            if (wsRef.current) {
                wsRef.current.close()
            }
        }
    }, [connect, ping])

    return {
        isConnected,
        subscribe,
        unsubscribe,
        ping
    }
}
