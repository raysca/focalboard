import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite"
import * as schema from "../db/schema.ts"

export type DB = BunSQLiteDatabase<typeof schema>
export type Transaction = Parameters<Parameters<DB["transaction"]>[0]>[0]

/**
 * Execute operations within a database transaction
 * Automatically rolls back on errors and commits on success
 *
 * @example
 * await withTransaction(db, async (tx) => {
 *   const board = await boardRepo.create(tx, data)
 *   await memberRepo.create(tx, { boardId: board.id, userId })
 *   return board
 * })
 */
export async function withTransaction<T>(
    db: DB,
    callback: (tx: Transaction) => Promise<T>
): Promise<T> {
    return db.transaction(async (tx) => {
        return await callback(tx)
    })
}

/**
 * Helper to check if we're currently in a transaction
 * Useful for nested service calls
 */
export function isTransaction(dbOrTx: DB | Transaction): dbOrTx is Transaction {
    // Drizzle transactions don't have a direct way to check, so we use type inference
    // In practice, repositories should accept both DB and Transaction
    return "rollback" in dbOrTx
}

/**
 * Get or start a transaction
 * If already in a transaction, reuse it
 * Otherwise, start a new transaction
 */
export async function getOrStartTransaction<T>(
    db: DB | Transaction,
    callback: (tx: Transaction) => Promise<T>
): Promise<T> {
    if (isTransaction(db)) {
        return callback(db)
    }
    return withTransaction(db, callback)
}
