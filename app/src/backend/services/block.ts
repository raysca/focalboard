import type { DB } from "./transaction.ts"
import { createBlockRepository } from "../repositories/block.repository.ts"
import { createBoardRepository } from "../repositories/board.repository.ts"
import {
    requireBoardEditor,
    requireBoardAccess,
    canViewBoard
} from "./authorization.ts"
import type { Block } from "../types/index.ts"
import type {
    CreateBlockInput,
    UpdateBlockInput,
    UpsertBlockInput
} from "../validation/schemas.ts"
import { ForbiddenError, NotFoundError, BadRequestError } from "../errors.ts"

export class BlockService {
    constructor(private db: DB) {}

    /**
     * Create a new block
     * Requires editor access to the board
     */
    async create(
        userId: string,
        boardId: string,
        data: CreateBlockInput
    ): Promise<Block> {
        // Check editor access
        requireBoardEditor(this.db, userId, boardId)

        const blockRepo = createBlockRepository(this.db)

        const now = Date.now()
        const id = data.id ?? crypto.randomUUID()

        return blockRepo.create({
            id,
            parentId: data.parentId,
            createdBy: userId,
            modifiedBy: userId,
            schema: data.schema,
            type: data.type,
            title: data.title,
            fields: data.fields,
            boardId,
            createAt: now,
            updateAt: now,
            deleteAt: 0
        })
    }

    /**
     * Update a block
     * Requires editor access to the board
     */
    async update(
        userId: string,
        blockId: string,
        updates: UpdateBlockInput
    ): Promise<Block> {
        const blockRepo = createBlockRepository(this.db)

        // Get block to find its board
        const block = blockRepo.findById(blockId)
        if (!block) {
            throw new NotFoundError("Block not found")
        }

        // Check editor access to the board
        requireBoardEditor(this.db, userId, block.boardId)

        return blockRepo.updateWithHistory(blockId, {
            ...updates,
            modifiedBy: userId,
            updateAt: Date.now()
        } as Partial<Block>)
    }

    /**
     * Delete a block
     * Requires editor access to the board
     */
    async delete(userId: string, blockId: string): Promise<void> {
        const blockRepo = createBlockRepository(this.db)

        // Get block to find its board
        const block = blockRepo.findById(blockId)
        if (!block) {
            throw new NotFoundError("Block not found")
        }

        // Check editor access to the board
        requireBoardEditor(this.db, userId, block.boardId)

        blockRepo.softDeleteWithHistory(blockId)
    }

    /**
     * Upsert blocks (insert or update)
     * Used for batch operations
     */
    async upsert(
        userId: string,
        boardId: string,
        blocksData: UpsertBlockInput[]
    ): Promise<Block[]> {
        // Check editor access
        requireBoardEditor(this.db, userId, boardId)

        const blockRepo = createBlockRepository(this.db)
        const now = Date.now()

        return blocksData.map((data) => {
            return blockRepo.upsert(data.id, {
                parentId: data.parentId,
                schema: data.schema,
                type: data.type,
                title: data.title,
                fields: data.fields,
                boardId,
                modifiedBy: userId,
                updateAt: now
            } as Partial<Block>)
        })
    }

    /**
     * Get blocks for a board
     * Requires view access to the board
     */
    async getByBoard(
        boardId: string,
        userId?: string,
        shareToken?: string
    ): Promise<Block[]> {
        // Check access
        if (!canViewBoard(this.db, boardId, userId, shareToken)) {
            throw new ForbiddenError("Access denied to board")
        }

        const blockRepo = createBlockRepository(this.db)
        return blockRepo.findByBoard(boardId)
    }

    /**
     * Get a single block by ID
     * Requires view access to the board
     */
    async getById(
        blockId: string,
        userId?: string,
        shareToken?: string
    ): Promise<Block | undefined> {
        const blockRepo = createBlockRepository(this.db)

        const block = blockRepo.findById(blockId)
        if (!block) {
            return undefined
        }

        // Check access to the board
        if (!canViewBoard(this.db, block.boardId, userId, shareToken)) {
            throw new ForbiddenError("Access denied to block")
        }

        return block
    }

    /**
     * Get block hierarchy (parent and children)
     * Requires view access to the board
     */
    async getTree(
        boardId: string,
        parentId: string,
        userId?: string,
        shareToken?: string
    ): Promise<Block[]> {
        // Check access
        if (!canViewBoard(this.db, boardId, userId, shareToken)) {
            throw new ForbiddenError("Access denied to board")
        }

        const blockRepo = createBlockRepository(this.db)
        return blockRepo.findByParent(parentId)
    }

    /**
     * Move a block to a different parent or board
     * Requires editor access to both source and destination boards
     */
    async move(
        userId: string,
        blockId: string,
        newParentId: string,
        newBoardId?: string
    ): Promise<Block> {
        const blockRepo = createBlockRepository(this.db)

        // Get current block
        const block = blockRepo.findById(blockId)
        if (!block) {
            throw new NotFoundError("Block not found")
        }

        // Check editor access to source board
        requireBoardEditor(this.db, userId, block.boardId)

        // If moving to a different board, check access to destination board
        if (newBoardId && newBoardId !== block.boardId) {
            requireBoardEditor(this.db, userId, newBoardId)

            // Verify destination board exists
            const boardRepo = createBoardRepository(this.db)
            if (!boardRepo.exists(newBoardId)) {
                throw new NotFoundError("Destination board not found")
            }
        }

        // Update block
        return blockRepo.updateWithHistory(blockId, {
            parentId: newParentId,
            boardId: newBoardId ?? block.boardId,
            modifiedBy: userId,
            updateAt: Date.now()
        } as Partial<Block>)
    }

    /**
     * Batch delete blocks
     * Requires editor access to the board
     */
    async batchDelete(userId: string, blockIds: string[]): Promise<void> {
        const blockRepo = createBlockRepository(this.db)

        // Verify all blocks belong to boards user has access to
        for (const blockId of blockIds) {
            const block = blockRepo.findById(blockId)
            if (block) {
                requireBoardEditor(this.db, userId, block.boardId)
            }
        }

        blockRepo.batchSoftDelete(blockIds)
    }
}

/**
 * Factory function to create BlockService
 */
export function createBlockService(db: DB): BlockService {
    return new BlockService(db)
}
