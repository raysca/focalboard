/**
 * EventService - Core event publishing and routing
 *
 * Responsibilities:
 * - Publish events after database operations
 * - Route events to RealtimeService for WebSocket broadcast
 * - Manage event listeners for automation
 * - Route events to NotificationService (Phase 2)
 *
 * Design principles:
 * - Events published AFTER successful DB commits (no phantom events)
 * - Events include before/after state (enables automation)
 * - Listeners execute in priority order
 * - Listener failures don't stop event propagation
 */

import type {
    Event,
    EventListener,
    EventPublishOptions,
    EventScope,
    EventType
} from '../types/events.ts'

export class EventService {
    private listeners = new Map<string, EventListener>()
    private broadcastHandler?: (event: Event) => void

    constructor() {}

    /**
     * Set broadcast handler for real-time delivery
     * Called by backend initialization to wire EventService to RealtimeService
     */
    setBroadcastHandler(handler: (event: Event) => void): void {
        this.broadcastHandler = handler
    }

    /**
     * Publish an event
     *
     * Flow:
     * 1. Execute registered listeners (for automation)
     * 2. Broadcast to RealtimeService (for WebSocket delivery)
     * 3. TODO Phase 2: Route to NotificationService
     *
     * @param event - Event to publish
     * @param options - Publishing options
     */
    async publish(event: Event, options: EventPublishOptions = {}): Promise<void> {
        try {
            // Execute listeners first (automation hooks)
            await this.executeListeners(event)

            // Broadcast via RealtimeService for real-time delivery
            if (!options.skipPubSub) {
                this.broadcastHandler?.(event)
            }

            // TODO Phase 2: Route to NotificationService
            // if (!options.skipNotifications) {
            //     await this.routeToNotifications(event)
            // }
        } catch (error) {
            console.error('[EventService] Error publishing event:', error)
            throw error
        }
    }

    /**
     * Register an event listener
     *
     * Used for automation, webhooks, and custom event handlers.
     * Listeners execute in priority order (lower = earlier).
     *
     * @param listener - Event listener configuration
     * @returns Unsubscribe function
     */
    registerListener(listener: EventListener): () => void {
        // Set default priority
        const listenerWithDefaults = {
            ...listener,
            priority: listener.priority ?? 100
        }

        this.listeners.set(listener.id, listenerWithDefaults)

        // Return unsubscribe function
        return () => {
            this.listeners.delete(listener.id)
        }
    }

    /**
     * Unregister an event listener
     */
    unregisterListener(listenerId: string): void {
        this.listeners.delete(listenerId)
    }

    /**
     * Execute registered listeners for an event
     * Listeners run in priority order, failures don't stop propagation
     */
    private async executeListeners(event: Event): Promise<void> {
        // Get matching listeners
        const matchingListeners = Array.from(this.listeners.values())
            .filter(listener => this.listenerMatches(listener, event))
            .sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100))

        // Execute listeners sequentially
        for (const listener of matchingListeners) {
            try {
                await listener.handler(event)
            } catch (error) {
                console.error(
                    `[EventService] Listener ${listener.id} failed:`,
                    error
                )
                // Continue with other listeners
            }
        }
    }

    /**
     * Check if listener matches event
     */
    private listenerMatches(listener: EventListener, event: Event): boolean {
        const eventTypes = Array.isArray(listener.eventType)
            ? listener.eventType
            : [listener.eventType]

        return eventTypes.includes(event.type)
    }
}

/**
 * Factory function to create EventService
 */
export function createEventService(): EventService {
    return new EventService()
}
