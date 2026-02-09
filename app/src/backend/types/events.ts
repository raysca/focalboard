/**
 * Event Type System for Real-Time Notifications
 *
 * This module defines the event types, scopes, and payloads used throughout
 * the real-time notification system. Events are published after database
 * operations and broadcast to connected WebSocket clients.
 *
 * Events include before/after state to enable future automation features.
 */

/**
 * Event types follow hierarchical naming: <entity>.<action>
 */
export enum EventType {
    // Board events
    BOARD_CREATED = 'board.created',
    BOARD_UPDATED = 'board.updated',
    BOARD_DELETED = 'board.deleted',
    BOARD_RESTORED = 'board.restored',
    BOARD_DUPLICATED = 'board.duplicated',

    // Block events (cards, views, etc.)
    BLOCK_CREATED = 'block.created',
    BLOCK_UPDATED = 'block.updated',
    BLOCK_DELETED = 'block.deleted',
    BLOCK_RESTORED = 'block.restored',
    BLOCK_MOVED = 'block.moved',

    // Member events
    MEMBER_ADDED = 'member.added',
    MEMBER_REMOVED = 'member.removed',
    MEMBER_ROLE_CHANGED = 'member.role_changed',

    // Comment events (block type = comment)
    COMMENT_CREATED = 'comment.created',
    COMMENT_UPDATED = 'comment.updated',
    COMMENT_DELETED = 'comment.deleted',

    // Dependency events
    DEPENDENCY_CREATED = 'dependency.created',
    DEPENDENCY_DELETED = 'dependency.deleted',

    // Category events
    CATEGORY_CREATED = 'category.created',
    CATEGORY_UPDATED = 'category.updated',
    CATEGORY_DELETED = 'category.deleted',
    CATEGORY_BOARD_ADDED = 'category.board_added',
    CATEGORY_BOARD_REMOVED = 'category.board_removed',

    // Presence events
    PRESENCE_JOIN = 'presence.join',
    PRESENCE_LEAVE = 'presence.leave',
    PRESENCE_UPDATE = 'presence.update',

    // Subscription events
    SUBSCRIPTION_CREATED = 'subscription.created',
    SUBSCRIPTION_DELETED = 'subscription.deleted',
}

/**
 * Event scope determines routing and broadcast behavior
 */
export enum EventScope {
    BOARD = 'board',   // Broadcast to all board members
    USER = 'user',     // Direct to specific user(s)
    TEAM = 'team',     // Broadcast to team members
    GLOBAL = 'global', // System-wide events
}

/**
 * Base event structure shared by all events
 */
export interface BaseEvent {
    id: string                    // Unique event ID (UUID)
    type: EventType               // Event type
    scope: EventScope             // Routing scope
    timestamp: number             // Unix timestamp (ms)
    actor: {                      // Who triggered the event
        userId: string
        username?: string
    }
    meta: {                       // Event metadata for routing
        boardId?: string
        teamId?: string
        blockId?: string
        parentId?: string
    }
}

/**
 * JSON Patch operation (RFC 6902)
 * Used for efficient diff representation
 */
export interface JsonPatch {
    op: 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test'
    path: string
    value?: unknown
    from?: string
}

/**
 * Entity change events include before/after state
 * This enables automation rules like "when status changes to Done"
 */
export interface EntityChangeEvent<T = unknown> extends BaseEvent {
    entity: {
        type: 'board' | 'block' | 'member' | 'dependency' | 'category'
        id: string
    }
    changes: {
        before: Partial<T> | null   // null for creates
        after: Partial<T> | null    // null for deletes
        diff?: JsonPatch[]          // Optional JSON Patch for efficient updates
    }
}

/**
 * Board events
 */
export interface BoardCreatedEvent extends EntityChangeEvent {
    type: EventType.BOARD_CREATED
    scope: EventScope.TEAM
    entity: { type: 'board'; id: string }
    changes: {
        before: null
        after: Record<string, unknown>
    }
}

export interface BoardUpdatedEvent extends EntityChangeEvent {
    type: EventType.BOARD_UPDATED
    scope: EventScope.BOARD
    entity: { type: 'board'; id: string }
    changes: {
        before: Record<string, unknown>
        after: Record<string, unknown>
        diff?: JsonPatch[]
    }
}

export interface BoardDeletedEvent extends EntityChangeEvent {
    type: EventType.BOARD_DELETED
    scope: EventScope.BOARD
    entity: { type: 'board'; id: string }
    changes: {
        before: Record<string, unknown>
        after: null
    }
}

/**
 * Block events (cards, views, comments)
 */
export interface BlockCreatedEvent extends EntityChangeEvent {
    type: EventType.BLOCK_CREATED
    scope: EventScope.BOARD
    entity: { type: 'block'; id: string }
    changes: {
        before: null
        after: Record<string, unknown>
    }
}

export interface BlockUpdatedEvent extends EntityChangeEvent {
    type: EventType.BLOCK_UPDATED
    scope: EventScope.BOARD
    entity: { type: 'block'; id: string }
    changes: {
        before: Record<string, unknown>
        after: Record<string, unknown>
        diff?: JsonPatch[]
    }
}

export interface BlockDeletedEvent extends EntityChangeEvent {
    type: EventType.BLOCK_DELETED
    scope: EventScope.BOARD
    entity: { type: 'block'; id: string }
    changes: {
        before: Record<string, unknown>
        after: null
    }
}

/**
 * Comment events
 */
export interface CommentCreatedEvent extends EntityChangeEvent {
    type: EventType.COMMENT_CREATED
    scope: EventScope.BOARD
    entity: { type: 'block'; id: string }
    changes: {
        before: null
        after: Record<string, unknown>
    }
    mentions?: string[]  // User IDs mentioned in comment
}

export interface CommentUpdatedEvent extends EntityChangeEvent {
    type: EventType.COMMENT_UPDATED
    scope: EventScope.BOARD
    entity: { type: 'block'; id: string }
    changes: {
        before: Record<string, unknown>
        after: Record<string, unknown>
        diff?: JsonPatch[]
    }
    mentions?: string[]
}

/**
 * Member events
 */
export interface MemberAddedEvent extends EntityChangeEvent {
    type: EventType.MEMBER_ADDED
    scope: EventScope.BOARD
    entity: { type: 'member'; id: string }
    changes: {
        before: null
        after: Record<string, unknown>
    }
    addedUserId: string  // The user who was added
}

export interface MemberRemovedEvent extends EntityChangeEvent {
    type: EventType.MEMBER_REMOVED
    scope: EventScope.BOARD
    entity: { type: 'member'; id: string }
    changes: {
        before: Record<string, unknown>
        after: null
    }
    removedUserId: string  // The user who was removed
}

/**
 * Presence events
 */
export interface PresenceJoinEvent extends BaseEvent {
    type: EventType.PRESENCE_JOIN
    scope: EventScope.BOARD
    presence: {
        userId: string
        boardId: string
        status: 'active' | 'idle' | 'away'
    }
}

export interface PresenceLeaveEvent extends BaseEvent {
    type: EventType.PRESENCE_LEAVE
    scope: EventScope.BOARD
    presence: {
        userId: string
        boardId: string
    }
}

export interface PresenceUpdateEvent extends BaseEvent {
    type: EventType.PRESENCE_UPDATE
    scope: EventScope.BOARD
    presence: {
        userId: string
        boardId: string
        locationId?: string         // Current card/view ID
        locationType?: 'card' | 'view' | 'board'
        status: 'active' | 'idle' | 'away'
    }
}

/**
 * Union type for all events
 */
export type Event =
    | BoardCreatedEvent
    | BoardUpdatedEvent
    | BoardDeletedEvent
    | BlockCreatedEvent
    | BlockUpdatedEvent
    | BlockDeletedEvent
    | CommentCreatedEvent
    | CommentUpdatedEvent
    | MemberAddedEvent
    | MemberRemovedEvent
    | PresenceJoinEvent
    | PresenceLeaveEvent
    | PresenceUpdateEvent
    | EntityChangeEvent  // Fallback for other event types

/**
 * Event listener configuration
 * Used for registering automation handlers
 */
export interface EventListener {
    id: string
    eventType: EventType | EventType[]  // Single or multiple types
    handler: (event: Event) => Promise<void> | void
    priority?: number  // Execution order (lower = earlier), default 100
}

/**
 * Event publishing options
 */
export interface EventPublishOptions {
    skipPubSub?: boolean         // For single-server optimization
    skipNotifications?: boolean  // Skip notification creation
    metadata?: Record<string, unknown>  // Additional metadata
}
