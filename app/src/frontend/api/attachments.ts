import { api } from './client'

export interface FileAttachment {
    id: string
    createAt: number
    deleteAt: number
    name: string
    extension: string
    size: number
    archived: boolean
    path: string
    blockId: string | null
    uploadedBy: string | null
    uploadedAt: number | null
}

export const attachmentsApi = {
    async upload(cardId: string, file: File): Promise<FileAttachment> {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch(`/api/v2/cards/${cardId}/attachments`, {
            method: 'POST',
            body: formData,
            credentials: 'include',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
            },
        })

        if (!response.ok) {
            const error = await response.text()
            throw new Error(error || 'Upload failed')
        }

        return response.json()
    },

    async list(cardId: string): Promise<FileAttachment[]> {
        return api.get(`/cards/${cardId}/attachments`)
    },

    async delete(cardId: string, attachmentId: string): Promise<{ success: boolean }> {
        return api.del(`/cards/${cardId}/attachments/${attachmentId}`)
    },

    getDownloadUrl(cardId: string, attachmentId: string): string {
        return `/api/v2/cards/${cardId}/attachments/${attachmentId}/download`
    },
}
