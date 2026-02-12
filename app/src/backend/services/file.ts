import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import type * as schemaType from '../db/schema.ts'
import { fileInfo, blocks } from '../db/schema.ts'
import { eq, and } from 'drizzle-orm'
import { join, extname } from 'path'
import { mkdir, unlink } from 'fs/promises'
import { config } from '../config.ts'
import { NotFoundError, BadRequestError, ForbiddenError } from '../errors.ts'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const MAX_CARD_TOTAL_SIZE = 200 * 1024 * 1024 // 200MB per card

const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'text/plain',
    'text/csv',
    'text/markdown',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
]

const ALLOWED_EXTENSIONS = [
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
    '.pdf',
    '.txt', '.csv', '.md',
    '.xls', '.xlsx',
    '.ppt', '.pptx',
    '.doc', '.docx',
    '.zip', '.rar',
]

interface UploadAttachmentParams {
    file: File
    cardId: string
    userId: string
    teamId: string
    boardId: string
}

export class FileService {
    constructor(private db: BunSQLiteDatabase<typeof schemaType>) {}

    async uploadCardAttachment(params: UploadAttachmentParams) {
        const { file, cardId, userId, teamId, boardId } = params

        // Validate file
        this.validateFile(file)

        // Check card total size
        await this.checkCardStorageLimit(cardId)

        // Generate file path
        const fileId = crypto.randomUUID()
        const ext = extname(file.name)
        const sanitizedName = this.sanitizeFilename(file.name)
        const dirPath = join(config.filespath, teamId, boardId, cardId)
        const filename = `${fileId}${ext}`
        const filePath = join(dirPath, filename)

        // Ensure directory exists
        await mkdir(dirPath, { recursive: true })

        // Write file to disk
        const buffer = await file.arrayBuffer()
        await Bun.write(filePath, buffer)

        const now = Date.now()

        // Create fileInfo record
        this.db.insert(fileInfo).values({
            id: fileId,
            createAt: now,
            deleteAt: 0,
            name: file.name,
            extension: ext,
            size: file.size,
            archived: false,
            path: filePath,
            blockId: cardId,
            uploadedBy: userId,
            uploadedAt: now,
        }).run()

        // Update card.fields.attachments array
        await this.addAttachmentToCard(cardId, fileId)

        // Return file info
        const attachment = this.db
            .select()
            .from(fileInfo)
            .where(eq(fileInfo.id, fileId))
            .get()

        return attachment
    }

    async getCardAttachments(cardId: string) {
        const attachments = this.db
            .select()
            .from(fileInfo)
            .where(
                and(
                    eq(fileInfo.blockId, cardId),
                    eq(fileInfo.deleteAt, 0),
                    eq(fileInfo.archived, false)
                )
            )
            .all()

        return attachments
    }

    async deleteAttachment(attachmentId: string, cardId: string) {
        // Get attachment
        const attachment = this.db
            .select()
            .from(fileInfo)
            .where(eq(fileInfo.id, attachmentId))
            .get()

        if (!attachment) {
            throw new NotFoundError('Attachment not found')
        }

        if (attachment.blockId !== cardId) {
            throw new ForbiddenError('Attachment does not belong to this card')
        }

        // Soft delete the attachment
        const now = Date.now()
        this.db
            .update(fileInfo)
            .set({ deleteAt: now, archived: true })
            .where(eq(fileInfo.id, attachmentId))
            .run()

        // Remove from card.fields.attachments
        await this.removeAttachmentFromCard(cardId, attachmentId)

        // Delete physical file
        try {
            await unlink(attachment.path)
        } catch (err) {
            // File might already be deleted, ignore error
            console.error('Failed to delete file:', err)
        }

        return { success: true }
    }

    async getAttachmentFile(attachmentId: string) {
        const attachment = this.db
            .select()
            .from(fileInfo)
            .where(eq(fileInfo.id, attachmentId))
            .get()

        if (!attachment || attachment.deleteAt !== 0) {
            throw new NotFoundError('Attachment not found')
        }

        return {
            filePath: attachment.path,
            filename: attachment.name,
            mimeType: this.getMimeType(attachment.extension),
            size: attachment.size,
        }
    }

    private validateFile(file: File) {
        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            throw new BadRequestError(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`)
        }

        // Check MIME type
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            throw new BadRequestError(`File type ${file.type} not allowed`)
        }

        // Check extension
        const ext = extname(file.name).toLowerCase()
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            throw new BadRequestError(`File extension ${ext} not allowed`)
        }
    }

    private async checkCardStorageLimit(cardId: string) {
        const attachments = await this.getCardAttachments(cardId)
        const totalSize = attachments.reduce((sum, att) => sum + att.size, 0)

        if (totalSize >= MAX_CARD_TOTAL_SIZE) {
            throw new BadRequestError(`Card storage limit exceeded. Maximum is ${MAX_CARD_TOTAL_SIZE / 1024 / 1024}MB`)
        }
    }

    private sanitizeFilename(filename: string): string {
        return filename
            .replace(/[^a-zA-Z0-9.-]/g, '_')
            .replace(/\.{2,}/g, '_')
            .replace(/^\./, '_')
            .substring(0, 255)
    }

    private async addAttachmentToCard(cardId: string, fileId: string) {
        const card = this.db
            .select()
            .from(blocks)
            .where(eq(blocks.id, cardId))
            .get()

        if (!card) {
            throw new NotFoundError('Card not found')
        }

        const fields = card.fields as Record<string, unknown>
        const attachments = (fields.attachments as string[]) || []

        if (!attachments.includes(fileId)) {
            attachments.push(fileId)
        }

        this.db
            .update(blocks)
            .set({
                fields: { ...fields, attachments },
                updateAt: Date.now(),
            })
            .where(eq(blocks.id, cardId))
            .run()
    }

    private async removeAttachmentFromCard(cardId: string, fileId: string) {
        const card = this.db
            .select()
            .from(blocks)
            .where(eq(blocks.id, cardId))
            .get()

        if (!card) {
            return
        }

        const fields = card.fields as Record<string, unknown>
        const attachments = (fields.attachments as string[]) || []

        const updatedAttachments = attachments.filter(id => id !== fileId)

        this.db
            .update(blocks)
            .set({
                fields: { ...fields, attachments: updatedAttachments },
                updateAt: Date.now(),
            })
            .where(eq(blocks.id, cardId))
            .run()
    }

    private getMimeType(extension: string): string {
        const mimeMap: Record<string, string> = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml',
            '.pdf': 'application/pdf',
            '.txt': 'text/plain',
            '.csv': 'text/csv',
            '.md': 'text/markdown',
            '.xls': 'application/vnd.ms-excel',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.ppt': 'application/vnd.ms-powerpoint',
            '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.zip': 'application/zip',
            '.rar': 'application/x-rar-compressed',
        }

        return mimeMap[extension.toLowerCase()] || 'application/octet-stream'
    }
}
