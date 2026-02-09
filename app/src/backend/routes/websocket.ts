/**
 * WebSocket Route
 *
 * Provides real-time communication via WebSocket.
 * Uses Hono's upgradeWebSocket helper with Better Auth session validation.
 *
 * Endpoint: GET /api/v2/ws
 *
 * Authentication:
 * - Session validated from cookies (Better Auth)
 * - Unauthenticated connections rejected with code 1008
 *
 * Message Protocol:
 * - Client → Server: subscribe, unsubscribe, ping
 * - Server → Client: event, error, pong, ack, connected
 */

import { Hono } from 'hono'
import { upgradeWebSocket } from 'hono/bun'
import type { Auth } from '../auth/index.ts'
import type { RealtimeService, WebSocketData } from '../services/realtime.service.ts'
import type { ClientMessage } from '../services/realtime.service.ts'

const websocketRoutes = new Hono()

/**
 * WebSocket endpoint with Better Auth authentication
 */
websocketRoutes.get(
    '/ws',
    upgradeWebSocket((c) => {
        return {
            /**
             * Connection opened
             * Authenticate and register with RealtimeService
             */
            async onOpen(evt, ws) {
                try {
                    // Get dependencies from context
                    const auth = c.get('auth') as Auth
                    const realtimeService = c.get('realtimeService') as RealtimeService

                    // Validate session from cookies (Better Auth automatically reads from headers)
                    const sessionResult = await auth.api.getSession({
                        headers: c.req.raw.headers
                    })

                    if (!sessionResult) {
                        console.log('[WebSocket] No valid session found')
                        ws.close(1008, 'Authentication required')
                        return
                    }

                    // Store authenticated user data in WebSocket
                    const wsData: WebSocketData = {
                        userId: sessionResult.user.id,
                        connectionId: crypto.randomUUID()
                    }
                    ws.data = wsData

                    // Register with RealtimeService
                    realtimeService.handleConnection(ws)

                    console.log(`[WebSocket] User ${sessionResult.user.id} connected`)
                } catch (error) {
                    console.error('[WebSocket] Error in onOpen:', error)
                    ws.close(1011, 'Internal server error')
                }
            },

            /**
             * Message received from client
             */
            async onMessage(evt, ws) {
                try {
                    const realtimeService = c.get('realtimeService') as RealtimeService

                    // Parse message
                    const message: ClientMessage = JSON.parse(evt.data as string)

                    // Handle message
                    await realtimeService.handleMessage(ws.data.connectionId, message)
                } catch (error) {
                    console.error('[WebSocket] Error handling message:', error)
                    ws.send(
                        JSON.stringify({
                            type: 'error',
                            code: 'INVALID_MESSAGE',
                            message: 'Invalid message format'
                        })
                    )
                }
            },

            /**
             * Connection closed
             */
            onClose(evt, ws) {
                try {
                    const realtimeService = c.get('realtimeService') as RealtimeService

                    if (ws.data?.connectionId) {
                        realtimeService.handleDisconnection(ws.data.connectionId)
                        console.log(`[WebSocket] User ${ws.data.userId} disconnected`)
                    }
                } catch (error) {
                    console.error('[WebSocket] Error in onClose:', error)
                }
            },

            /**
             * Error occurred
             */
            onError(evt, ws, error) {
                console.error('[WebSocket] Connection error:', error)
            }
        }
    })
)

export default websocketRoutes
