import { eq, and, inArray, type SQL } from "drizzle-orm"
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite"
import * as schema from "../db/schema.ts"
import { boards, boardsHistory } from "../db/schema.ts"
import { Repository } from "./base.ts"
import type { Transaction } from "../services/transaction.ts"
import type { Board } from "../types/index.ts"

type DB = BunSQLiteDatabase<typeof schema>

export class BoardRepository extends Repository<typeof boards, Board> {
    constructor(db: DB | Transaction) {
        super(db, boards, true) // hasDeleteAt = true
    }

    /**
     * Find boards by team ID
     */
    findByTeam(teamId: string): Board[] {
        return this.findAll(
            and(
                eq(boards.teamId, teamId),
                eq(boards.deleteAt, 0)
            )
        )
    }

    /**
     * Find boards by team ID and user membership
     */
    findByTeamAndUser(teamId: string, boardIds: string[]): Board[] {
        if (boardIds.length === 0) {
            return []
        }

        return this.findAll(
            and(
                eq(boards.teamId, teamId),
                inArray(boards.id, boardIds),
                eq(boards.deleteAt, 0)
            )
        )
    }

    /**
     * Find boards by multiple IDs
     */
    findByIds(ids: string[]): Board[] {
        if (ids.length === 0) {
            return []
        }

        return this.findAll(
            and(
                inArray(boards.id, ids),
                eq(boards.deleteAt, 0)
            )
        )
    }

    /**
     * Find template boards
     */
    findTemplates(teamId?: string): Board[] {
        const conditions: SQL<unknown>[] = [
            eq(boards.isTemplate, true),
            eq(boards.deleteAt, 0)
        ]

        if (teamId) {
            conditions.push(eq(boards.teamId, teamId))
        }

        return this.findAll(and(...conditions))
    }

    /**
     * Find open boards (type "O") in a team
     */
    findOpenBoards(teamId: string): Board[] {
        return this.findAll(
            and(
                eq(boards.teamId, teamId),
                eq(boards.type, "O"),
                eq(boards.deleteAt, 0)
            )
        )
    }

    /**
     * Record board to history table
     */
    recordHistory(boardId: string): void {
        const board = this.findById(boardId)
        if (!board) return

        this.db
            .insert(boardsHistory)
            .values({
                ...board,
                insertAt: Date.now()
            } as any)
            .run()
    }

    /**
     * Update board with automatic history recording
     */
    updateWithHistory(id: string, data: Partial<Board>): Board {
        // Record current state to history before updating
        this.recordHistory(id)

        // Perform update
        return this.update(id, data as Record<string, unknown>)
    }

    /**
     * Soft delete board with history recording
     */
    softDeleteWithHistory(id: string): void {
        // Record current state to history before deletion
        this.recordHistory(id)

        // Perform soft delete
        this.softDelete(id)
    }
}

/**
 * Factory function to create BoardRepository
 */
export function createBoardRepository(db: DB | Transaction): BoardRepository {
    return new BoardRepository(db)
}
