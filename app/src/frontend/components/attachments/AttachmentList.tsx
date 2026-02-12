import React, { useRef } from 'react'
import { Paperclip } from 'lucide-react'
import { useAttachments } from '../../hooks/useAttachments'
import { AttachmentItem } from './AttachmentItem'

interface AttachmentListProps {
    cardId: string
    readonly?: boolean
}

export function AttachmentList({ cardId, readonly }: AttachmentListProps) {
    const { attachments, isLoading, upload, isUploading, deleteAttachment } = useAttachments(cardId)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files?.length) return

        Array.from(files).forEach((file) => {
            upload(file)
        })

        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    if (isLoading) {
        return (
            <div className="px-6 py-4">
                <div className="text-sm text-center-fg/50">Loading attachments...</div>
            </div>
        )
    }

    if (attachments.length === 0 && readonly) {
        return null
    }

    return (
        <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-center-fg">
                    Attachments {attachments.length > 0 && `(${attachments.length})`}
                </h3>
                {!readonly && (
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 text-sm text-link hover:text-link-hover transition-colors"
                    >
                        <Paperclip className="w-4 h-4" />
                        Add attachment
                    </button>
                )}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
            />

            {attachments.length > 0 ? (
                <div className="space-y-1">
                    {attachments.map((attachment) => (
                        <AttachmentItem
                            key={attachment.id}
                            attachment={attachment}
                            cardId={cardId}
                            onDelete={deleteAttachment}
                            readonly={readonly}
                        />
                    ))}
                </div>
            ) : (
                !readonly && (
                    <div className="text-sm text-center-fg/30 text-center py-4">
                        No attachments yet. Click &quot;Add attachment&quot; to upload files.
                    </div>
                )
            )}

            {isUploading && (
                <div className="mt-2 text-sm text-center-fg/50">Uploading...</div>
            )}
        </div>
    )
}
