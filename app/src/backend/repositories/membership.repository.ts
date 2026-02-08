import { eq, and } from "drizzle-orm"
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite"
import * as schema from "../db/schema.ts"
import { boardMembers, boardMembersHistory } from "../db/schema.ts"
import type { Transaction } from "../services/transaction.ts"
import type { BoardMember } from "../types/index.ts"

type DB = BunSQLiteDatabase<typeof schema>

export class MembershipRepository {
    constructor(protected db: DB | Transaction) {}

    /**
     * Find member by board and user ID
     */
    findMember(boardId: string, userId: string): BoardMember | undefined {
        return this.db
            .select()
            .from(boardMembers)
            .where(
                and(
                    eq(boardMembers.boardId, boardId),
                    eq(boardMembers.userId, userId)
                )
            )
            .get() as BoardMember | undefined
    }

    /**
     * Find all members of a board
     */
    findByBoard(boardId: string): BoardMember[] {
        return this.db
            .select()
            .from(boardMembers)
            .where(eq(boardMembers.boardId, boardId))
            .all() as BoardMember[]
    }

    /**
     * Find all boards a user is a member of
     */
    findByUser(userId: string): BoardMember[] {
        return this.db
            .select()
            .from(boardMembers)
            .where(eq(boardMembers.userId, userId))
            .all() as BoardMember[]
    }

    /**
     * Find board IDs a user is a member of
     */
    findBoardIdsByUser(userId: string): string[] {
        const members = this.findByUser(userId)
        return members.map((m) => m.boardId)
    }

    /**
     * Add a member to a board
     */
    addMember(data: {
        boardId: string
        userId: string
        schemeAdmin?: boolean
        schemeEditor?: boolean
        schemeCommenter?: boolean
        schemeViewer?: boolean
    }): BoardMember {
        const memberData = {
            boardId: data.boardId,
            userId: data.userId,
            roles: "",
            minimumRole: "",
            schemeAdmin: data.schemeAdmin ?? false,
            schemeEditor: data.schemeEditor ?? true,
            schemeCommenter: data.schemeCommenter ?? true,
            schemeViewer: data.schemeViewer ?? true
        }

        this.db.insert(boardMembers).values(memberData).run()

        // Record history
        this.recordHistory(data.boardId, data.userId, "add")

        return this.findMember(data.boardId, data.userId)!
    }

    /**
     * Update member roles
     */
    updateMember(
        boardId: string,
        userId: string,
        updates: {
            schemeAdmin?: boolean
            schemeEditor?: boolean
            schemeCommenter?: boolean
            schemeViewer?: boolean
        }
    ): BoardMember {
        // Record history before update
        this.recordHistory(boardId, userId, "update")

        this.db
            .update(boardMembers)
            .set(updates)
            .where(
                and(
                    eq(boardMembers.boardId, boardId),
                    eq(boardMembers.userId, userId)
                )
            )
            .run()

        return this.findMember(boardId, userId)!
    }

    /**
     * Remove a member from a board
     */
    removeMember(boardId: string, userId: string): void {
        // Record history before deletion
        this.recordHistory(boardId, userId, "delete")

        this.db
            .delete(boardMembers)
            .where(
                and(
                    eq(boardMembers.boardId, boardId),
                    eq(boardMembers.userId, userId)
                )
            )
            .run()
    }

    /**
     * Check if user is a member of a board
     */
    isMember(boardId: string, userId: string): boolean {
        return this.findMember(boardId, userId) !== undefined
    }

    /**
     * Count members of a board
     */
    countMembers(boardId: string): number {
        return this.findByBoard(boardId).length
    }

    /**
     * Record membership change to history
     */
    recordHistory(
        boardId: string,
        userId: string,
        action: "add" | "update" | "delete" | "join" | "leave"
    ): void {
        this.db
            .insert(boardMembersHistory)
            .values({
                boardId,
                userId,
                action,
                insertAt: Date.now()
            })
            .run()
    }
}

/**
 * Factory function to create MembershipRepository
 */
export function createMembershipRepository(
    db: DB | Transaction
): MembershipRepository {
    return new MembershipRepository(db)
}
