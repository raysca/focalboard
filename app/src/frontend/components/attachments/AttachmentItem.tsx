import React from 'react'
import { FileText, File, Image, FileSpreadsheet, Archive, Trash2 } from 'lucide-react'
import { cn } from '../../lib/cn'
import type { FileAttachment } from '../../api/attachments'
import { attachmentsApi } from '../../api/attachments'

interface AttachmentItemProps {
    attachment: FileAttachment
    cardId: string
    onDelete: (id: string) => void
    readonly?: boolean
}

export function AttachmentItem({ attachment, cardId, onDelete, readonly }: AttachmentItemProps) {
    const downloadUrl = attachmentsApi.getDownloadUrl(cardId, attachment.id)
    const icon = getFileIcon(attachment.extension)

    const handleDownload = async (e: React.MouseEvent) => {
        e.preventDefault()
        try {
            const response = await fetch(downloadUrl, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
            })

            if (!response.ok) {
                throw new Error('Download failed')
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.style.display = 'none'
            a.href = url
            a.download = attachment.name
            a.target = '_blank'
            document.body.appendChild(a)
            a.click()

            // Clean up after a delay to ensure download starts
            setTimeout(() => {
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
            }, 100)
        } catch (error) {
            console.error('Download failed:', error)
            alert('Failed to download file. Please try again.')
        }
    }

    return (
        <div className="flex items-center gap-2 p-2 rounded hover:bg-hover group">
            <div className="flex-shrink-0">{icon}</div>

            <div className="flex-1 min-w-0">
                <a
                    href="#"
                    onClick={handleDownload}
                    className="text-sm font-medium text-link hover:underline truncate block"
                >
                    {attachment.name}
                </a>
                <div className="text-xs text-center-fg/50">
                    {formatFileSize(attachment.size)}
                    {attachment.uploadedAt && (
                        <> • {formatDate(attachment.uploadedAt)}</>
                    )}
                </div>
            </div>

            {!readonly && (
                <button
                    onClick={() => onDelete(attachment.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 rounded transition-opacity"
                    title="Delete attachment"
                >
                    <Trash2 className="w-4 h-4 text-red-600" />
                </button>
            )}
        </div>
    )
}

function getFileIcon(extension: string) {
    const ext = extension.toLowerCase()

    if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) {
        return <Image className="w-5 h-5 text-purple-500" />
    }

    if (ext === '.pdf') {
        return <FileText className="w-5 h-5 text-red-500" />
    }

    if (['.doc', '.docx'].includes(ext)) {
        return <FileText className="w-5 h-5 text-blue-500" />
    }

    if (['.xls', '.xlsx'].includes(ext)) {
        return <FileSpreadsheet className="w-5 h-5 text-green-500" />
    }

    if (['.ppt', '.pptx'].includes(ext)) {
        return <FileText className="w-5 h-5 text-orange-500" />
    }

    if (['.zip', '.rar'].includes(ext)) {
        return <Archive className="w-5 h-5 text-gray-500" />
    }

    return <File className="w-5 h-5 text-gray-400" />
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

function formatDate(timestamp: number): string {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString()
}
