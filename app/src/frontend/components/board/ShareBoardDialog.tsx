import React, {useState, useEffect} from 'react'
import {Copy, Check, Link2} from 'lucide-react'
import {Dialog} from '../ui/Dialog'
import {Button} from '../ui/Button'
import {sharingApi} from '../../api/sharing'
import type {Sharing} from '../../api/types'

interface ShareBoardDialogProps {
    open: boolean
    onClose: () => void
    boardId: string
}

export function ShareBoardDialog({open, onClose, boardId}: ShareBoardDialogProps) {
    const [sharing, setSharing] = useState<Sharing | null>(null)
    const [loading, setLoading] = useState(true)
    const [copied, setCopied] = useState(false)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (!open) return
        setLoading(true)
        sharingApi.getSharing(boardId)
            .then(setSharing)
            .catch(() => setSharing(null))
            .finally(() => setLoading(false))
    }, [open, boardId])

    const handleToggleSharing = async () => {
        setSaving(true)
        try {
            const newEnabled = !sharing?.enabled
            await sharingApi.setSharing(boardId, {
                enabled: newEnabled,
                token: sharing?.token || crypto.randomUUID(),
            })
            const updated = await sharingApi.getSharing(boardId)
            setSharing(updated)
        } catch (e) {
            // error handling
        }
        setSaving(false)
    }

    const handleCopyLink = () => {
        if (!sharing?.token) return
        const url = `${window.location.origin}/shared/${boardId}?token=${sharing.token}`
        navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const shareUrl = sharing?.token
        ? `${window.location.origin}/shared/${boardId}?token=${sharing.token}`
        : ''

    return (
        <Dialog open={open} onClose={onClose} title="Share Board" maxWidth="max-w-md">
            <div className="p-5">
                {loading ? (
                    <div className="text-sm text-center-fg/50">Loading...</div>
                ) : (
                    <>
                        {/* Toggle sharing */}
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <div className="text-sm font-medium">Public sharing</div>
                                <div className="text-xs text-center-fg/50">
                                    Anyone with the link can view this board
                                </div>
                            </div>
                            <button
                                onClick={handleToggleSharing}
                                disabled={saving}
                                className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                                    sharing?.enabled ? 'bg-button-bg' : 'bg-center-fg/20'
                                }`}
                            >
                                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                                    sharing?.enabled ? 'translate-x-[22px]' : 'translate-x-0.5'
                                }`} />
                            </button>
                        </div>

                        {/* Share link */}
                        {sharing?.enabled && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 flex items-center h-9 px-3 rounded border border-border-default bg-center-fg/5 text-xs text-center-fg/70 overflow-hidden">
                                        <Link2 size={12} className="mr-2 shrink-0" />
                                        <span className="truncate">{shareUrl}</span>
                                    </div>
                                    <Button
                                        size="small"
                                        onClick={handleCopyLink}
                                        icon={copied ? <Check size={14} /> : <Copy size={14} />}
                                    >
                                        {copied ? 'Copied' : 'Copy'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Dialog>
    )
}
