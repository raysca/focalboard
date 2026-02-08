import type { DB } from "./transaction.ts"
import { createMembershipRepository } from "../repositories/membership.repository.ts"
import {
    requireBoardAdmin,
    requireBoardExists,
    isBoardOpen,
    getUserBoardRole,
    BoardRole
} from "./authorization.ts"
import type { BoardMember } from "../types/index.ts"
import type { AddMemberInput, UpdateMemberInput } from "../validation/schemas.ts"
import { ForbiddenError, BadRequestError } from "../errors.ts"

export class MembershipService {
    constructor(private db: DB) {}

    /**
     * Add a member to a board
     * Requires admin access
     */
    async addMember(
        userId: string,
        boardId: string,
        data: AddMemberInput
    ): Promise<BoardMember> {
        // Check admin access
        requireBoardAdmin(this.db, userId, boardId)

        const memberRepo = createMembershipRepository(this.db)

        // Check if user is already a member
        if (memberRepo.isMember(boardId, data.userId)) {
            throw new BadRequestError("User is already a member of this board")
        }

        return memberRepo.addMember({
            boardId,
            userId: data.userId,
            schemeAdmin: data.schemeAdmin,
            schemeEditor: data.schemeEditor,
            schemeCommenter: data.schemeCommenter,
            schemeViewer: data.schemeViewer
        })
    }

    /**
     * Update member roles
     * Requires admin access
     */
    async updateMemberRoles(
        userId: string,
        boardId: string,
        targetUserId: string,
        updates: UpdateMemberInput
    ): Promise<BoardMember> {
        // Check admin access
        requireBoardAdmin(this.db, userId, boardId)

        const memberRepo = createMembershipRepository(this.db)

        // Check if target user is a member
        if (!memberRepo.isMember(boardId, targetUserId)) {
            throw new BadRequestError("User is not a member of this board")
        }

        return memberRepo.updateMember(boardId, targetUserId, updates)
    }

    /**
     * Remove a member from a board
     * Requires admin access
     */
    async removeMember(
        userId: string,
        boardId: string,
        targetUserId: string
    ): Promise<void> {
        // Check admin access
        requireBoardAdmin(this.db, userId, boardId)

        const memberRepo = createMembershipRepository(this.db)

        // Check if target user is a member
        if (!memberRepo.isMember(boardId, targetUserId)) {
            throw new BadRequestError("User is not a member of this board")
        }

        // Prevent removing the last admin
        const members = memberRepo.findByBoard(boardId)
        const admins = members.filter((m) => m.schemeAdmin)

        if (admins.length === 1 && admins[0]?.userId === targetUserId) {
            throw new BadRequestError(
                "Cannot remove the last admin from the board"
            )
        }

        memberRepo.removeMember(boardId, targetUserId)
    }

    /**
     * User leaves a board
     * Allowed if board is open or user is a member
     */
    async leave(userId: string, boardId: string): Promise<void> {
        requireBoardExists(this.db, boardId)

        const memberRepo = createMembershipRepository(this.db)

        // Check if user is a member
        if (!memberRepo.isMember(boardId, userId)) {
            throw new BadRequestError("You are not a member of this board")
        }

        // Prevent leaving if user is the last admin
        const members = memberRepo.findByBoard(boardId)
        const admins = members.filter((m) => m.schemeAdmin)

        if (admins.length === 1 && admins[0]?.userId === userId) {
            throw new BadRequestError(
                "Cannot leave board as the last admin. Please assign another admin first."
            )
        }

        // Record as "leave" action
        memberRepo.recordHistory(boardId, userId, "leave")
        memberRepo.removeMember(boardId, userId)
    }

    /**
     * User joins an open board
     * Only allowed for open boards (type "O")
     */
    async join(userId: string, boardId: string): Promise<BoardMember> {
        requireBoardExists(this.db, boardId)

        // Check if board is open
        if (!isBoardOpen(this.db, boardId)) {
            throw new ForbiddenError("Board is not open for joining")
        }

        const memberRepo = createMembershipRepository(this.db)

        // Check if already a member
        if (memberRepo.isMember(boardId, userId)) {
            throw new BadRequestError("You are already a member of this board")
        }

        // Add as viewer by default
        const member = memberRepo.addMember({
            boardId,
            userId,
            schemeAdmin: false,
            schemeEditor: false,
            schemeCommenter: true,
            schemeViewer: true
        })

        // Record as "join" action
        memberRepo.recordHistory(boardId, userId, "join")

        return member
    }

    /**
     * List members of a board
     * Requires at least viewer access
     */
    async listMembers(userId: string, boardId: string): Promise<BoardMember[]> {
        // Check if user has access to view members
        const role = getUserBoardRole(this.db, userId, boardId)
        if (role === BoardRole.NONE) {
            throw new ForbiddenError("Access denied to board members")
        }

        const memberRepo = createMembershipRepository(this.db)
        return memberRepo.findByBoard(boardId)
    }

    /**
     * Get user's role on a board
     */
    getUserRole(userId: string, boardId: string): BoardMember | undefined {
        const memberRepo = createMembershipRepository(this.db)
        return memberRepo.findMember(boardId, userId)
    }
}

/**
 * Factory function to create MembershipService
 */
export function createMembershipService(db: DB): MembershipService {
    return new MembershipService(db)
}
