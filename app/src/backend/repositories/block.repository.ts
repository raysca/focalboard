import { eq, and, inArray, count } from "drizzle-orm"
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite"
import * as schema from "../db/schema.ts"
import { blocks, blocksHistory } from "../db/schema.ts"
import { Repository } from "./base.ts"
import type { Transaction } from "../services/transaction.ts"
import type { Block } from "../types/index.ts"

type DB = BunSQLiteDatabase<typeof schema>

export class BlockRepository extends Repository<typeof blocks, Block> {
    constructor(db: DB | Transaction) {
        super(db, blocks, true) // hasDeleteAt = true
    }

    /**
     * Find blocks by board ID
     */
    findByBoard(boardId: string): Block[] {
        return this.findAll(
            and(
                eq(blocks.boardId, boardId),
                eq(blocks.deleteAt, 0)
            )
        )
    }

    /**
     * Find blocks by parent ID
     */
    findByParent(parentId: string): Block[] {
        return this.findAll(
            and(
                eq(blocks.parentId, parentId),
                eq(blocks.deleteAt, 0)
            )
        )
    }

    /**
     * Find blocks by type
     */
    findByType(boardId: string, type: string): Block[] {
        return this.findAll(
            and(
                eq(blocks.boardId, boardId),
                eq(blocks.type, type),
                eq(blocks.deleteAt, 0)
            )
        )
    }

    /**
     * Find blocks by multiple IDs
     */
    findByIds(ids: string[]): Block[] {
        if (ids.length === 0) {
            return []
        }

        return this.findAll(
            and(
                inArray(blocks.id, ids),
                eq(blocks.deleteAt, 0)
            )
        )
    }

    /**
     * Upsert a block (insert if doesn't exist, update if exists)
     */
    upsert(id: string, data: Partial<Block>): Block {
        const existing = this.findById(id)

        if (existing) {
            return this.updateWithHistory(id, data)
        } else {
            return this.create({ id, ...data } as Record<string, unknown>)
        }
    }

    /**
     * Batch upsert multiple blocks
     */
    batchUpsert(blocksData: Array<{ id: string } & Partial<Block>>): Block[] {
        return blocksData.map((data) => this.upsert(data.id, data))
    }

    /**
     * Record block to history table
     */
    recordHistory(blockId: string): void {
        const block = this.findById(blockId)
        if (!block) return

        this.db
            .insert(blocksHistory)
            .values({
                ...block,
                insertAt: Date.now()
            } as any)
            .run()
    }

    /**
     * Update block with automatic history recording
     */
    updateWithHistory(id: string, data: Partial<Block>): Block {
        // Record current state to history before updating
        this.recordHistory(id)

        // Perform update
        return this.update(id, data as Record<string, unknown>)
    }

    /**
     * Soft delete block with history recording
     */
    softDeleteWithHistory(id: string): void {
        // Record current state to history before deletion
        this.recordHistory(id)

        // Perform soft delete
        this.softDelete(id)
    }

    /**
     * Count cards (type='card') per board for multiple boards
     */
    countCardsByBoards(boardIds: string[]): Record<string, number> {
        if (boardIds.length === 0) return {}
        const rows = this.db
            .select({boardId: blocks.boardId, count: count()})
            .from(blocks)
            .where(and(inArray(blocks.boardId, boardIds), eq(blocks.type, 'card'), eq(blocks.deleteAt, 0)))
            .groupBy(blocks.boardId)
            .all()
        const result: Record<string, number> = {}
        for (const row of rows) {
            result[row.boardId] = Number(row.count)
        }
        return result
    }

    /**
     * Soft delete multiple blocks with history
     */
    batchSoftDelete(ids: string[]): void {
        for (const id of ids) {
            this.softDeleteWithHistory(id)
        }
    }
}

/**
 * Factory function to create BlockRepository
 */
export function createBlockRepository(db: DB | Transaction): BlockRepository {
    return new BlockRepository(db)
}
