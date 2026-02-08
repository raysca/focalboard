import { eq, and } from "drizzle-orm"
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite"
import * as schema from "../db/schema.ts"
import { boards, boardMembers, sharing } from "../db/schema.ts"
import { ForbiddenError, NotFoundError } from "../errors.ts"

type DB = BunSQLiteDatabase<typeof schema>

/**
 * User role levels (in order of permissions)
 */
export enum BoardRole {
    NONE = 0,
    VIEWER = 1,
    COMMENTER = 2,
    EDITOR = 3,
    ADMIN = 4
}

/**
 * Board member information with role details
 */
export interface BoardMemberRole {
    boardId: string
    userId: string
    role: BoardRole
    schemeAdmin: boolean
    schemeEditor: boolean
    schemeCommenter: boolean
    schemeViewer: boolean
}

/**
 * Get user's role on a board
 * Returns NONE if user is not a member
 */
export function getUserBoardRole(
    db: DB,
    userId: string,
    boardId: string
): BoardRole {
    const member = db
        .select()
        .from(boardMembers)
        .where(
            and(
                eq(boardMembers.boardId, boardId),
                eq(boardMembers.userId, userId)
            )
        )
        .get()

    if (!member) {
        return BoardRole.NONE
    }

    // Determine highest role level
    if (member.schemeAdmin) return BoardRole.ADMIN
    if (member.schemeEditor) return BoardRole.EDITOR
    if (member.schemeCommenter) return BoardRole.COMMENTER
    if (member.schemeViewer) return BoardRole.VIEWER

    return BoardRole.NONE
}

/**
 * Get detailed board member information
 */
export function getBoardMember(
    db: DB,
    userId: string,
    boardId: string
): BoardMemberRole | undefined {
    const member = db
        .select()
        .from(boardMembers)
        .where(
            and(
                eq(boardMembers.boardId, boardId),
                eq(boardMembers.userId, userId)
            )
        )
        .get()

    if (!member) {
        return undefined
    }

    const role = getUserBoardRole(db, userId, boardId)

    return {
        boardId: member.boardId,
        userId: member.userId,
        role,
        schemeAdmin: member.schemeAdmin,
        schemeEditor: member.schemeEditor,
        schemeCommenter: member.schemeCommenter,
        schemeViewer: member.schemeViewer
    }
}

/**
 * Check if user has at least the required role on a board
 * Throws ForbiddenError if access is denied
 */
export function requireBoardRole(
    db: DB,
    userId: string,
    boardId: string,
    requiredRole: BoardRole
): void {
    const userRole = getUserBoardRole(db, userId, boardId)

    if (userRole < requiredRole) {
        throw new ForbiddenError("Insufficient permissions")
    }
}

/**
 * Check if user has admin access to a board
 * Throws ForbiddenError if not an admin
 */
export function requireBoardAdmin(
    db: DB,
    userId: string,
    boardId: string
): void {
    requireBoardRole(db, userId, boardId, BoardRole.ADMIN)
}

/**
 * Check if user has editor access to a board
 * Throws ForbiddenError if not at least an editor
 */
export function requireBoardEditor(
    db: DB,
    userId: string,
    boardId: string
): void {
    requireBoardRole(db, userId, boardId, BoardRole.EDITOR)
}

/**
 * Check if user can view a board
 * Considers:
 * 1. Direct board membership
 * 2. Share token (if provided)
 * 3. Open board type (type "O")
 *
 * Returns true if user can view, false otherwise
 */
export function canViewBoard(
    db: DB,
    boardId: string,
    userId?: string,
    shareToken?: string
): boolean {
    // Check if board exists and is not deleted
    const board = db
        .select()
        .from(boards)
        .where(and(eq(boards.id, boardId), eq(boards.deleteAt, 0)))
        .get()

    if (!board) {
        return false
    }

    // If user is authenticated, check membership
    if (userId) {
        const member = db
            .select()
            .from(boardMembers)
            .where(
                and(
                    eq(boardMembers.boardId, boardId),
                    eq(boardMembers.userId, userId)
                )
            )
            .get()

        if (member) {
            return true
        }

        // Check if board is open (type "O") - allows any authenticated user
        if (board.type === "O") {
            return true
        }
    }

    // Check share token
    if (shareToken) {
        const shareInfo = db
            .select()
            .from(sharing)
            .where(eq(sharing.id, boardId))
            .get()

        if (shareInfo?.enabled && shareInfo.token === shareToken) {
            return true
        }
    }

    return false
}

/**
 * Check board access and throw error if denied
 * Considers membership, share tokens, and open boards
 */
export function requireBoardAccess(
    db: DB,
    boardId: string,
    userId?: string,
    shareToken?: string
): void {
    if (!canViewBoard(db, boardId, userId, shareToken)) {
        throw new ForbiddenError("Access denied to board")
    }
}

/**
 * Check if board exists and is not deleted
 * Throws NotFoundError if board doesn't exist
 */
export function requireBoardExists(db: DB, boardId: string): void {
    const board = db
        .select()
        .from(boards)
        .where(and(eq(boards.id, boardId), eq(boards.deleteAt, 0)))
        .get()

    if (!board) {
        throw new NotFoundError("Board not found")
    }
}

/**
 * Check if user is a member of a board
 */
export function isBoardMember(
    db: DB,
    userId: string,
    boardId: string
): boolean {
    return getUserBoardRole(db, userId, boardId) !== BoardRole.NONE
}

/**
 * Check if board is open (type "O")
 * Open boards allow any authenticated user to view
 */
export function isBoardOpen(db: DB, boardId: string): boolean {
    const board = db
        .select()
        .from(boards)
        .where(eq(boards.id, boardId))
        .get()

    return board?.type === "O"
}

/**
 * Validate share token for a board
 */
export function validateShareToken(
    db: DB,
    boardId: string,
    token: string
): boolean {
    const shareInfo = db
        .select()
        .from(sharing)
        .where(eq(sharing.id, boardId))
        .get()

    return shareInfo?.enabled === true && shareInfo.token === token
}
