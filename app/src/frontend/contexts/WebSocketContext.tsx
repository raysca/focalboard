import React, {createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode} from 'react'
import {useQueryClient} from '@tanstack/react-query'

/**
 * Event types from backend
 */
export type EventType =
    | 'board.created'
    | 'board.updated'
    | 'board.deleted'
    | 'block.created'
    | 'block.updated'
    | 'block.deleted'
    | 'comment.created'
    | 'member.added'
    | 'member.removed'

export type EventScope = 'board' | 'user' | 'team' | 'global'

export interface Event {
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
        oldBoardId?: string
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
    | {type: 'event'; event: Event}
    | {type: 'error'; code: string; message: string}
    | {type: 'pong'; timestamp: number}
    | {type: 'ack'; success: boolean}
    | {type: 'connected'; userId: string}

/**
 * Client → Server message types
 */
type ClientMessage =
    | {type: 'subscribe'; scope: EventScope; id: string}
    | {type: 'unsubscribe'; scope: EventScope; id: string}
    | {type: 'ping'}

interface WebSocketContextType {
    isConnected: boolean
    subscribe: (scope: EventScope, id: string) => void
    unsubscribe: (scope: EventScope, id: string) => void
    registerListener: (listener: (event: Event) => void) => () => void
}

const WebSocketContext = createContext<WebSocketContextType | null>(null)

export function WebSocketProvider({children}: {children: ReactNode}) {
    const [isConnected, setIsConnected] = useState(false)
    const wsRef = useRef<WebSocket | null>(null)
    const reconnectTimerRef = useRef<number | null>(null)
    // We use a Set in a ref for listeners to avoid re-renders when listeners change
    const listenersRef = useRef<Set<(event: Event) => void>>(new Set())
    const queryClient = useQueryClient()

    // Handle global query invalidation
    const handleGlobalInvalidation = useCallback((event: Event) => {
        // console.log('[WebSocket] Global Event received:', event.type, event.meta)

        switch (event.type) {
            case 'board.created':
            case 'board.updated':
            case 'board.deleted':
                if (event.meta.boardId) {
                    queryClient.invalidateQueries({queryKey: ['board', event.meta.boardId]})
                }
                queryClient.invalidateQueries({queryKey: ['boards']})
                break

            case 'block.created':
            case 'block.updated':
            case 'block.deleted':
            case 'comment.created':
                if (event.meta.boardId) {
                    queryClient.invalidateQueries({queryKey: ['blocks', event.meta.boardId]})
                }
                if (event.meta.blockId) {
                    queryClient.invalidateQueries({queryKey: ['block', event.meta.blockId]})
                }
                // Handle block move which might affect two boards
                if (event.meta.oldBoardId && event.meta.oldBoardId !== event.meta.boardId) {
                    queryClient.invalidateQueries({
                        queryKey: ['blocks', event.meta.oldBoardId]
                    })
                }
                break

            case 'member.added':
            case 'member.removed':
                if (event.meta.boardId) {
                    queryClient.invalidateQueries({
                        queryKey: ['members', event.meta.boardId]
                    })
                }
                break
        }
    }, [queryClient])

    const connect = useCallback(() => {
        if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current)
            reconnectTimerRef.current = null
        }

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        // Use relative path for flexibility
        const wsUrl = `${protocol}//${window.location.host}/api/v2/ws`
        // console.log('[WebSocket] Connecting to:', wsUrl)

        const ws = new WebSocket(wsUrl)

        ws.onopen = () => {
            console.log('[WebSocket] Connected')
            setIsConnected(true)
            wsRef.current = ws
        }

        ws.onmessage = (messageEvent) => {
            try {
                const message: any = JSON.parse(messageEvent.data)

                if (message.type === 'connected') {
                    // console.log('[WebSocket] Authenticated as:', message.userId)
                } else if (message.type === 'event') {
                    const event = message.event as Event
                    // 1. Global Invalidation
                    handleGlobalInvalidation(event)
                    // 2. Notify Listeners
                    listenersRef.current.forEach(listener => listener(event))
                } else if (message.type === 'error') {
                    console.error('[WebSocket] Error:', message.code, message.message)
                }
            } catch (error) {
                console.error('[WebSocket] Error parsing message:', error)
            }
        }

        ws.onclose = () => {
            console.log('[WebSocket] Disconnected')
            setIsConnected(false)
            wsRef.current = null

            // Reconnect
            if (!reconnectTimerRef.current) {
                reconnectTimerRef.current = window.setTimeout(() => {
                    console.log('[WebSocket] Reconnecting...')
                    connect()
                }, 3000)
            }
        }

        ws.onerror = (error) => {
            console.error('[WebSocket] Connection error:', error)
        }
    }, [handleGlobalInvalidation])

    // Initial connection and heartbeat
    useEffect(() => {
        connect()

        const heartbeatInterval = setInterval(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({type: 'ping'}))
            }
        }, 30000)

        return () => {
            clearInterval(heartbeatInterval)
            if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
            if (wsRef.current) wsRef.current.close()
        }
    }, [connect])

    const subscribe = useCallback((scope: EventScope, id: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            const message: ClientMessage = {type: 'subscribe', scope, id}
            wsRef.current.send(JSON.stringify(message))
        }
    }, [])

    const unsubscribe = useCallback((scope: EventScope, id: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            const message: ClientMessage = {type: 'unsubscribe', scope, id}
            wsRef.current.send(JSON.stringify(message))
        }
    }, [])

    const registerListener = useCallback((listener: (event: Event) => void) => {
        listenersRef.current.add(listener)
        return () => {
            listenersRef.current.delete(listener)
        }
    }, [])

    return (
        <WebSocketContext.Provider value={{isConnected, subscribe, unsubscribe, registerListener}}>
            {children}
        </WebSocketContext.Provider>
    )
}

export function useWebSocketContext() {
    const context = useContext(WebSocketContext)
    if (!context) {
        throw new Error('useWebSocketContext must be used within a WebSocketProvider')
    }
    return context
}
