import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite"
import * as schema from "../db/schema.ts"
import { createBoardRepository } from "../repositories/board.repository.ts"
import { createMembershipRepository } from "../repositories/membership.repository.ts"
import { createBlockRepository } from "../repositories/block.repository.ts"
import { withTransaction, type DB } from "./transaction.ts"
import {
    requireBoardAccess,
    requireBoardAdmin,
    requireBoardEditor,
    requireBoardExists,
    canViewBoard
} from "./authorization.ts"
import type { Board } from "../types/index.ts"
import type { CreateBoardInput, UpdateBoardInput } from "../validation/schemas.ts"
import { ForbiddenError, NotFoundError } from "../errors.ts"

export class BoardService {
    constructor(private db: DB) {}

    /**
     * Create a new board and auto-add creator as admin member
     * Uses transaction to ensure atomic operation
     */
    async create(userId: string, data: CreateBoardInput): Promise<Board> {
        return withTransaction(this.db, async (tx) => {
            const boardRepo = createBoardRepository(tx)
            const memberRepo = createMembershipRepository(tx)

            const now = Date.now()
            const id = crypto.randomUUID()

            // Create board
            const board = boardRepo.create({
                id,
                teamId: data.teamId,
                channelId: data.channelId,
                createdBy: userId,
                modifiedBy: userId,
                type: data.type,
                minimumRole: data.minimumRole,
                title: data.title,
                description: data.description,
                icon: data.icon,
                showDescription: data.showDescription,
                isTemplate: data.isTemplate,
                templateVersion: data.templateVersion,
                properties: data.properties,
                cardProperties: data.cardProperties,
                createAt: now,
                updateAt: now,
                deleteAt: 0
            })

            // Record initial history
            boardRepo.recordHistory(id)

            // Auto-add creator as admin member
            memberRepo.addMember({
                boardId: id,
                userId,
                schemeAdmin: true,
                schemeEditor: true,
                schemeCommenter: true,
                schemeViewer: true
            })

            return board
        })
    }

    /**
     * Duplicate a board with all its blocks
     * Uses transaction to ensure atomic operation
     */
    async duplicate(userId: string, boardId: string): Promise<Board> {
        return withTransaction(this.db, async (tx) => {
            const boardRepo = createBoardRepository(tx)
            const blockRepo = createBlockRepository(tx)
            const memberRepo = createMembershipRepository(tx)

            // Check if original board exists
            const original = boardRepo.findById(boardId)
            if (!original) {
                throw new NotFoundError("Board not found")
            }

            // Check if user has access to original board
            requireBoardAccess(tx as any, boardId, userId)

            const now = Date.now()
            const newBoardId = crypto.randomUUID()

            // Create duplicate board
            const newBoard = boardRepo.create({
                ...original,
                id: newBoardId,
                createdBy: userId,
                modifiedBy: userId,
                title: `${original.title} copy`,
                createAt: now,
                updateAt: now,
                deleteAt: 0
            })

            // Duplicate blocks
            const originalBlocks = blockRepo.findByBoard(boardId)

            // Create ID mapping for block relationships
            const idMap = new Map<string, string>()
            for (const block of originalBlocks) {
                idMap.set(block.id, crypto.randomUUID())
            }

            // Create duplicate blocks with remapped IDs
            for (const block of originalBlocks) {
                blockRepo.create({
                    ...block,
                    id: idMap.get(block.id)!,
                    parentId: idMap.get(block.parentId) ?? block.parentId,
                    boardId: newBoardId,
                    createdBy: userId,
                    modifiedBy: userId,
                    createAt: now,
                    updateAt: now,
                    deleteAt: 0
                })
            }

            // Add creator as admin member
            memberRepo.addMember({
                boardId: newBoardId,
                userId,
                schemeAdmin: true,
                schemeEditor: true,
                schemeCommenter: true,
                schemeViewer: true
            })

            return newBoard
        })
    }

    /**
     * Get board by ID with access control
     */
    getById(
        boardId: string,
        userId?: string,
        shareToken?: string
    ): Board | undefined {
        const boardRepo = createBoardRepository(this.db)

        // Check if board exists
        const board = boardRepo.findById(boardId)
        if (!board) {
            return undefined
        }

        // Check access
        if (!canViewBoard(this.db, boardId, userId, shareToken)) {
            throw new ForbiddenError("Access denied to board")
        }

        return board
    }

    /**
     * Get board by ID or throw error
     */
    getByIdOrFail(
        boardId: string,
        userId?: string,
        shareToken?: string
    ): Board {
        const board = this.getById(boardId, userId, shareToken)
        if (!board) {
            throw new NotFoundError("Board not found")
        }
        return board
    }

    /**
     * List boards by team that user has access to
     */
    listByTeam(userId: string, teamId: string): Board[] {
        const boardRepo = createBoardRepository(this.db)
        const memberRepo = createMembershipRepository(this.db)

        // Get boards user is a member of
        const boardIds = memberRepo.findBoardIdsByUser(userId)
        if (boardIds.length === 0) {
            return []
        }

        return boardRepo.findByTeamAndUser(teamId, boardIds)
    }

    /**
     * Update board with permission check
     */
    async update(
        userId: string,
        boardId: string,
        updates: UpdateBoardInput
    ): Promise<Board> {
        // Check editor access
        requireBoardEditor(this.db, userId, boardId)

        const boardRepo = createBoardRepository(this.db)
        return boardRepo.updateWithHistory(boardId, {
            ...updates,
            modifiedBy: userId,
            updateAt: Date.now()
        } as Partial<Board>)
    }

    /**
     * Soft delete board with permission check
     */
    async delete(userId: string, boardId: string): Promise<void> {
        // Check admin access
        requireBoardAdmin(this.db, userId, boardId)

        const boardRepo = createBoardRepository(this.db)
        boardRepo.softDeleteWithHistory(boardId)
    }

    /**
     * Get templates (optionally filtered by team)
     */
    listTemplates(teamId?: string): Board[] {
        const boardRepo = createBoardRepository(this.db)
        return boardRepo.findTemplates(teamId)
    }

    /**
     * Undelete a board (restore from soft delete)
     */
    async undelete(userId: string, boardId: string): Promise<Board> {
        // Check admin access
        requireBoardAdmin(this.db, userId, boardId)

        const boardRepo = createBoardRepository(this.db)
        return boardRepo.update(boardId, {
            deleteAt: 0,
            updateAt: Date.now()
        } as Record<string, unknown>)
    }
}

/**
 * Factory function to create BoardService
 */
export function createBoardService(db: DB): BoardService {
    return new BoardService(db)
}
