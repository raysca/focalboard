import { eq, and, type SQL, type SQLiteTable } from "drizzle-orm"
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite"
import * as schema from "../db/schema.ts"
import { NotFoundError } from "../errors.ts"

type DB = BunSQLiteDatabase<typeof schema>
type Transaction = Parameters<Parameters<DB["transaction"]>[0]>[0]

/**
 * Base repository interface for entities with soft delete support
 */
export interface BaseRepository<T> {
    findById(id: string): T | undefined
    findAll(filters?: Record<string, unknown>): T[]
    create(data: Partial<T>): T
    update(id: string, data: Partial<T>): T
    softDelete(id: string): void
    hardDelete(id: string): void
}

/**
 * Soft delete filter helper
 * Automatically filters out soft-deleted records (deleteAt !== 0)
 */
export function withSoftDeleteFilter<T extends { deleteAt: number }>(
    conditions: SQL<unknown>[]
): SQL<unknown> {
    return and(...conditions)!
}

/**
 * Creates a soft delete filter for tables with deleteAt column
 */
export function notDeleted<T extends SQLiteTable>(
    table: T & { deleteAt: ReturnType<typeof eq> extends SQL<unknown> ? unknown : never }
): SQL<unknown> {
    return eq((table as any).deleteAt, 0)
}

/**
 * Generic repository factory for entities with soft delete support
 */
export class Repository<
    TTable extends SQLiteTable,
    TSelect extends Record<string, unknown>
> {
    constructor(
        protected db: DB | Transaction,
        protected table: TTable,
        protected hasDeleteAt: boolean = false
    ) {}

    /**
     * Find entity by ID with automatic soft delete filtering
     */
    findById(id: string): TSelect | undefined {
        const conditions: SQL<unknown>[] = [eq((this.table as any).id, id)]

        if (this.hasDeleteAt) {
            conditions.push(eq((this.table as any).deleteAt, 0))
        }

        return this.db
            .select()
            .from(this.table)
            .where(and(...conditions))
            .get() as TSelect | undefined
    }

    /**
     * Find entity by ID or throw NotFoundError
     */
    findByIdOrFail(id: string): TSelect {
        const entity = this.findById(id)
        if (!entity) {
            throw new NotFoundError(`${this.table} not found`)
        }
        return entity
    }

    /**
     * Find all entities matching conditions
     */
    findAll(where?: SQL<unknown>): TSelect[] {
        const conditions: SQL<unknown>[] = []

        if (where) {
            conditions.push(where)
        }

        if (this.hasDeleteAt) {
            conditions.push(eq((this.table as any).deleteAt, 0))
        }

        const query = this.db.select().from(this.table)

        if (conditions.length > 0) {
            return query.where(and(...conditions)).all() as TSelect[]
        }

        return query.all() as TSelect[]
    }

    /**
     * Create a new entity
     */
    create(data: Record<string, unknown>): TSelect {
        const now = Date.now()

        const entityData = {
            ...data,
            createAt: this.hasDeleteAt ? now : undefined,
            updateAt: this.hasDeleteAt ? now : undefined,
            deleteAt: this.hasDeleteAt ? 0 : undefined
        }

        this.db.insert(this.table).values(entityData as any).run()

        return this.findById(data.id as string)!
    }

    /**
     * Update an entity by ID
     */
    update(id: string, data: Record<string, unknown>): TSelect {
        const updateData = {
            ...data,
            updateAt: this.hasDeleteAt ? Date.now() : undefined
        }

        this.db
            .update(this.table)
            .set(updateData as any)
            .where(eq((this.table as any).id, id))
            .run()

        return this.findByIdOrFail(id)
    }

    /**
     * Soft delete an entity (set deleteAt to current timestamp)
     */
    softDelete(id: string): void {
        if (!this.hasDeleteAt) {
            throw new Error(`${this.table} does not support soft delete`)
        }

        this.db
            .update(this.table)
            .set({ deleteAt: Date.now() } as any)
            .where(eq((this.table as any).id, id))
            .run()
    }

    /**
     * Hard delete an entity (physically remove from database)
     */
    hardDelete(id: string): void {
        this.db
            .delete(this.table)
            .where(eq((this.table as any).id, id))
            .run()
    }

    /**
     * Check if entity exists
     */
    exists(id: string): boolean {
        return this.findById(id) !== undefined
    }

    /**
     * Count entities matching conditions
     */
    count(where?: SQL<unknown>): number {
        const conditions: SQL<unknown>[] = []

        if (where) {
            conditions.push(where)
        }

        if (this.hasDeleteAt) {
            conditions.push(eq((this.table as any).deleteAt, 0))
        }

        const query = this.db.select().from(this.table)

        if (conditions.length > 0) {
            return query.where(and(...conditions)).all().length
        }

        return query.all().length
    }
}

/**
 * Transaction wrapper helper
 * Provides a clean way to execute multiple operations in a transaction
 */
export async function withTransaction<T>(
    db: DB,
    callback: (tx: Transaction) => Promise<T>
): Promise<T> {
    return db.transaction(callback)
}
