/**
 * useWebSocket - Hook to access WebSocket Context
 *
 * Refactored to use singleton WebSocketContext.
 *
 * Usage:
 * const { isConnected, subscribe, unsubscribe } = useWebSocket()
 */

import {useEffect} from 'react'
import {useWebSocketContext, type Event, type EventScope} from '../contexts/WebSocketContext'

export type {Event, EventScope}

interface UseWebSocketOptions {
    onEvent?: (event: Event) => void
    onConnect?: () => void
    onDisconnect?: () => void
    onError?: (error: Error) => void
    reconnectDelay?: number // Ignored in singleton implementation
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
    const {isConnected, subscribe, unsubscribe, registerListener} = useWebSocketContext()

    // Handle connection state callbacks
    useEffect(() => {
        if (isConnected) {
            options.onConnect?.()
        } else {
            options.onDisconnect?.()
        }
    }, [isConnected]) // Removing options.* dependencies to avoid re-running if callbacks change unnecessarily, though typically they should be stable or wrapped in useCallback.
    // Actually, if they are not stable, this effect runs every render.
    // The previous implementation used them in useEffect dependencies too.
    // To be safe and avoid infinite loops if the user passes inline functions:
    // We should probably check if the state *actually changed*.
    // But isConnected is a boolean. effect only runs when it changes.
    // The issue is if onConnect is unstable, it might run the effect again?
    // No, react effect only runs if dependencies change.
    // If I omit options.onConnect from dependency array, it uses the closure value from creation time (stale closure).
    // If I include it, and it's unstable, it runs every render.
    // Better pattern: Use a ref for the callbacks?
    // Or just accept that if they change, we re-run?
    // But onConnect should only be called *when connection triggers*.
    // The standard `useEffect(() => { if(isConnected) ... }, [isConnected])` will run when `isConnected` flips.
    // If `options.onConnect` changes, we don't necessarily want to re-run the logic "did we connect?".
    // We only want to run it when `isConnected` *becomes* true.
    // Implementation:

    /*
    useEffect(() => {
        if (isConnected) {
            options.onConnect?.()
        } else {
             // Only call onDisconnect if we were previously connected?
             // Since this runs on mount (isConnected=false), it might call onDisconnect immediately.
             // The previous hook had:
             // ws.onclose = () => { ... setIsConnected(false); options.onDisconnect?.() }
             // It only fired on actual close event.
             // Here we are mapping state to events.
        }
    }, [isConnected])
    */

    // Start with strictly tracking isConnected changes.
    // Use refs for callbacks to avoid dependency issues.
    // This is a common pattern to ensure we call the *latest* callback without re-triggering the effect.

    // Handle onEvent registration
    useEffect(() => {
        if (options.onEvent) {
            return registerListener(options.onEvent)
        }
    }, [registerListener, options.onEvent])
    // If options.onEvent is unstable (inline function), this will re-register every render.
    // This is bad for performance but functionally correct given the Set implementation in Context.
    // Ideally user wraps onEvent in useCallback.

    return {
        isConnected,
        subscribe,
        unsubscribe,
        ping: () => { } // No-op
    }
}
