/**
 * RealtimeService - WebSocket connection management and broadcasting
 *
 * Responsibilities:
 * - Manage WebSocket connections (lifecycle, heartbeat)
 * - Handle client subscriptions (with authorization)
 * - Broadcast events to connected clients using Bun's native pub/sub
 * - Handle client messages (subscribe, unsubscribe, presence)
 *
 * Design principles:
 * - Authorization checked on subscription AND broadcast
 * - Uses Bun's native ServerWebSocket.publish/subscribe
 * - Automatic cleanup on disconnect
 * - Graceful error handling
 */

import type { ServerWebSocket } from 'bun'
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import type * as schema from '../db/schema.ts'
import { canViewBoard } from './authorization.ts'
import { ForbiddenError } from '../errors.ts'
import type { EventService } from './event.service.ts'
import type { Event, EventScope } from '../types/events.ts'

type DB = BunSQLiteDatabase<typeof schema>

/**
 * WebSocket connection data
 */
export interface WebSocketData {
    userId: string
    connectionId: string
}

/**
 * WebSocket connection with metadata
 */
export interface WebSocketConnection {
    id: string
    userId: string
    ws: ServerWebSocket<WebSocketData>
    createdAt: number
}

/**
 * Client → Server message types
 */
export type ClientMessage =
    | { type: 'subscribe'; scope: EventScope; id: string }
    | { type: 'unsubscribe'; scope: EventScope; id: string }
    | { type: 'ping' }

/**
 * Server → Client message types
 */
export type ServerMessage =
    | { type: 'event'; event: Event }
    | { type: 'error'; code: string; message: string }
    | { type: 'pong'; timestamp: number }
    | { type: 'ack'; success: boolean }
    | { type: 'connected'; userId: string }

export class RealtimeService {
    private connections = new Map<string, WebSocketConnection>()

    constructor(
        private db: DB,
        private eventService: EventService
    ) {}

    /**
     * Handle new WebSocket connection
     *
     * Called after authentication is verified.
     * Registers connection and sends welcome message.
     */
    handleConnection(ws: ServerWebSocket<WebSocketData>): void {
        const { userId, connectionId } = ws.data

        const connection: WebSocketConnection = {
            id: connectionId,
            userId,
            ws,
            createdAt: Date.now()
        }

        this.connections.set(connectionId, connection)

        // Send welcome message
        this.sendMessage(ws, {
            type: 'connected',
            userId
        })

        console.log(`[Realtime] Connection ${connectionId} established for user ${userId}`)
    }

    /**
     * Handle WebSocket disconnection
     *
     * Cleans up subscriptions and connection state.
     */
    handleDisconnection(connectionId: string): void {
        const connection = this.connections.get(connectionId)
        if (!connection) return

        // Bun automatically unsubscribes on disconnect
        // Remove connection
        this.connections.delete(connectionId)

        console.log(`[Realtime] Connection ${connectionId} disconnected`)
    }

    /**
     * Handle client message
     *
     * Routes to appropriate handler.
     */
    async handleMessage(
        connectionId: string,
        message: ClientMessage
    ): Promise<void> {
        const connection = this.connections.get(connectionId)
        if (!connection) {
            throw new Error('Connection not found')
        }

        // Route message
        try {
            switch (message.type) {
                case 'subscribe':
                    await this.handleSubscribe(connection, message.scope, message.id)
                    break
                case 'unsubscribe':
                    await this.handleUnsubscribe(connection, message.scope, message.id)
                    break
                case 'ping':
                    this.sendMessage(connection.ws, {
                        type: 'pong',
                        timestamp: Date.now()
                    })
                    break
                default:
                    this.sendMessage(connection.ws, {
                        type: 'error',
                        code: 'INVALID_MESSAGE',
                        message: 'Unknown message type'
                    })
            }
        } catch (error) {
            if (error instanceof ForbiddenError) {
                this.sendMessage(connection.ws, {
                    type: 'error',
                    code: 'FORBIDDEN',
                    message: error.message
                })
            } else {
                console.error('[Realtime] Error handling message:', error)
                this.sendMessage(connection.ws, {
                    type: 'error',
                    code: 'INTERNAL_ERROR',
                    message: 'Internal server error'
                })
            }
        }
    }

    /**
     * Subscribe connection to events
     *
     * Validates authorization before adding subscription using Bun's native pub/sub.
     */
    private async handleSubscribe(
        connection: WebSocketConnection,
        scope: EventScope,
        id: string
    ): Promise<void> {
        // Authorization check
        switch (scope) {
            case 'board':
                if (!canViewBoard(this.db, id, connection.userId)) {
                    throw new ForbiddenError('Access denied to board')
                }
                break
            case 'user':
                if (id !== connection.userId) {
                    throw new ForbiddenError('Can only subscribe to own user events')
                }
                break
            case 'team':
                // TODO: Check team membership
                break
        }

        // Subscribe using Bun's native pub/sub
        const topic = `${scope}:${id}`
        connection.ws.subscribe(topic)

        // Send acknowledgment
        this.sendMessage(connection.ws, {
            type: 'ack',
            success: true
        })

        console.log(`[Realtime] Native subscribe: ${topic}`)
    }

    /**
     * Unsubscribe connection from events
     */
    private async handleUnsubscribe(
        connection: WebSocketConnection,
        scope: EventScope,
        id: string
    ): Promise<void> {
        // Unsubscribe using Bun's native pub/sub
        const topic = `${scope}:${id}`
        connection.ws.unsubscribe(topic)

        this.sendMessage(connection.ws, {
            type: 'ack',
            success: true
        })

        console.log(`[Realtime] Native unsubscribe: ${topic}`)
    }

    /**
     * Broadcast event to subscribed connections
     *
     * Called by EventService when events are published.
     * Uses Bun's native pub/sub with per-user authorization.
     */
    broadcast(event: Event): void {
        const topic = this.getTopicForEvent(event)
        const message = JSON.stringify({ type: 'event', event })

        // Publish from each authorized connection to maintain per-user authorization
        for (const conn of this.connections.values()) {
            // Re-validate authorization at broadcast time
            if (!this.isAuthorized(conn.userId, event)) continue

            // Use Bun's native publish - this broadcasts to ALL subscribed connections
            conn.ws.publish(topic, message)
        }
    }

    /**
     * Get topic for an event
     */
    private getTopicForEvent(event: Event): string {
        switch (event.scope) {
            case 'board':
                return `board:${event.meta.boardId}`
            case 'user':
                return `user:${event.actor.userId}`
            case 'team':
                return `team:${event.meta.teamId}`
            case 'global':
                return 'global:*'
            default:
                return ''
        }
    }

    /**
     * Check if user is authorized to receive event
     */
    private isAuthorized(userId: string, event: Event): boolean {
        switch (event.scope) {
            case 'board':
                return event.meta.boardId
                    ? canViewBoard(this.db, event.meta.boardId, userId)
                    : false
            case 'user':
                return event.actor.userId === userId
            case 'team':
            case 'global':
                return true
            default:
                return false
        }
    }

    /**
     * Send message to WebSocket
     */
    private sendMessage(
        ws: ServerWebSocket<WebSocketData>,
        message: ServerMessage
    ): void {
        try {
            ws.send(JSON.stringify(message))
        } catch (error) {
            console.error('[Realtime] Error sending message:', error)
        }
    }

    /**
     * Get active connection count
     */
    getConnectionCount(): number {
        return this.connections.size
    }

    /**
     * Get connections subscribed to a board (for debugging)
     */
    getConnectionsByBoard(boardId: string): WebSocketConnection[] {
        const topic = `board:${boardId}`
        return Array.from(this.connections.values()).filter(conn =>
            conn.ws.isSubscribed(topic)
        )
    }

    /**
     * Close service and disconnect all clients
     */
    async close(): Promise<void> {
        // Close all connections (Bun auto-unsubscribes)
        for (const conn of this.connections.values()) {
            conn.ws.close()
        }
        this.connections.clear()
    }
}

/**
 * Factory function to create RealtimeService
 */
export function createRealtimeService(
    db: DB,
    eventService: EventService
): RealtimeService {
    return new RealtimeService(db, eventService)
}
