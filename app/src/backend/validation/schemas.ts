import { z } from "zod"

// ===== Board Schemas =====

export const createBoardSchema = z.object({
    teamId: z.string().optional().default(""),
    channelId: z.string().optional().default(""),
    type: z.enum(["O", "P"]).optional().default("O"), // O = Open, P = Private
    minimumRole: z.string().optional().default(""),
    title: z.string().min(1, "Title is required"),
    description: z.string().optional().default(""),
    icon: z.string().optional().default(""),
    showDescription: z.boolean().optional().default(false),
    isTemplate: z.boolean().optional().default(false),
    templateVersion: z.number().int().optional().default(0),
    properties: z.record(z.unknown()).optional().default({}),
    cardProperties: z.array(z.unknown()).optional().default([])
})

export const updateBoardSchema = z.object({
    teamId: z.string().optional(),
    channelId: z.string().optional(),
    type: z.enum(["O", "P"]).optional(),
    minimumRole: z.string().optional(),
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    icon: z.string().optional(),
    showDescription: z.boolean().optional(),
    isTemplate: z.boolean().optional(),
    templateVersion: z.number().int().optional(),
    properties: z.record(z.unknown()).optional(),
    cardProperties: z.array(z.unknown()).optional()
})

// ===== Block Schemas =====

export const createBlockSchema = z.object({
    id: z.string().uuid().optional(),
    parentId: z.string().optional().default(""),
    schema: z.number().int().optional().default(0),
    type: z.string().min(1, "Type is required"),
    title: z.string().optional().default(""),
    fields: z.record(z.unknown()).optional().default({})
})

export const updateBlockSchema = z.object({
    parentId: z.string().optional(),
    schema: z.number().int().optional(),
    type: z.string().optional(),
    title: z.string().optional(),
    fields: z.record(z.unknown()).optional()
})

export const upsertBlockSchema = z.object({
    id: z.string().uuid(),
    parentId: z.string().optional().default(""),
    schema: z.number().int().optional().default(0),
    type: z.string().min(1, "Type is required"),
    title: z.string().optional().default(""),
    fields: z.record(z.unknown()).optional().default({})
})

// ===== Member Schemas =====

export const addMemberSchema = z.object({
    userId: z.string().uuid("Invalid user ID"),
    schemeAdmin: z.boolean().optional().default(false),
    schemeEditor: z.boolean().optional().default(true),
    schemeCommenter: z.boolean().optional().default(true),
    schemeViewer: z.boolean().optional().default(true)
})

export const updateMemberSchema = z.object({
    schemeAdmin: z.boolean().optional(),
    schemeEditor: z.boolean().optional(),
    schemeCommenter: z.boolean().optional(),
    schemeViewer: z.boolean().optional()
}).refine(
    (data) => Object.keys(data).length > 0,
    "At least one role must be specified"
)

// ===== Category Schemas =====

export const createCategorySchema = z.object({
    name: z.string().min(1, "Category name is required"),
    teamId: z.string().uuid("Invalid team ID"),
    sorting: z.string().optional().default("manual"),
    type: z.string().optional().default("")
})

export const updateCategorySchema = z.object({
    name: z.string().min(1).optional(),
    sorting: z.string().optional(),
    type: z.string().optional(),
    collapsed: z.boolean().optional()
})

export const reorderCategoryBoardsSchema = z.object({
    boardIds: z.array(z.string().uuid())
})

// ===== Share Schemas =====

export const createShareSchema = z.object({
    enabled: z.boolean().optional().default(true)
})

// ===== Team Schemas =====

export const createTeamSchema = z.object({
    title: z.string().min(1, "Team title is required"),
    settings: z.record(z.unknown()).optional().default({})
})

export const updateTeamSchema = z.object({
    title: z.string().min(1).optional(),
    settings: z.record(z.unknown()).optional()
})

// ===== User Schemas =====

export const updateUserProfileSchema = z.object({
    username: z.string().optional(),
    nickname: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional()
})

export const updatePreferencesSchema = z.object({
    category: z.string().min(1, "Category is required"),
    name: z.string().min(1, "Name is required"),
    value: z.string()
})

// ===== Search Schemas =====

export const searchBoardsSchema = z.object({
    q: z.string().min(1, "Search query is required"),
    teamId: z.string().uuid().optional()
})

// ===== Batch Operations =====

export const batchBoardsAndBlocksSchema = z.object({
    boards: z.array(createBoardSchema).optional().default([]),
    blocks: z.array(upsertBlockSchema).optional().default([])
})

export const updateBatchBoardsAndBlocksSchema = z.object({
    boardIDs: z.array(z.string().uuid()).optional().default([]),
    boardPatches: z.array(updateBoardSchema).optional().default([]),
    blockIDs: z.array(z.string().uuid()).optional().default([]),
    blockPatches: z.array(updateBlockSchema).optional().default([])
})

export const deleteBatchBoardsAndBlocksSchema = z.object({
    boardIDs: z.array(z.string().uuid()).optional().default([]),
    blockIDs: z.array(z.string().uuid()).optional().default([])
})

// Export types for TypeScript inference
export type CreateBoardInput = z.infer<typeof createBoardSchema>
export type UpdateBoardInput = z.infer<typeof updateBoardSchema>
export type CreateBlockInput = z.infer<typeof createBlockSchema>
export type UpdateBlockInput = z.infer<typeof updateBlockSchema>
export type UpsertBlockInput = z.infer<typeof upsertBlockSchema>
export type AddMemberInput = z.infer<typeof addMemberSchema>
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>
export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
export type CreateShareInput = z.infer<typeof createShareSchema>
export type CreateTeamInput = z.infer<typeof createTeamSchema>
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>
export type SearchBoardsInput = z.infer<typeof searchBoardsSchema>
export type BatchBoardsAndBlocksInput = z.infer<typeof batchBoardsAndBlocksSchema>
export type UpdateBatchBoardsAndBlocksInput = z.infer<typeof updateBatchBoardsAndBlocksSchema>
export type DeleteBatchBoardsAndBlocksInput = z.infer<typeof deleteBatchBoardsAndBlocksSchema>
