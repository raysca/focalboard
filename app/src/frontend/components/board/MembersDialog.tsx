import React, {useState, useEffect} from 'react'
import {UserPlus, Shield, Pencil, Eye, Trash2} from 'lucide-react'
import {Dialog} from '../ui/Dialog'
import {Input} from '../ui/Input'
import {Button} from '../ui/Button'
import {membersApi} from '../../api/members'
import type {BoardMember} from '../../api/types'

interface MembersDialogProps {
    open: boolean
    onClose: () => void
    boardId: string
}

export function MembersDialog({open, onClose, boardId}: MembersDialogProps) {
    const [members, setMembers] = useState<BoardMember[]>([])
    const [loading, setLoading] = useState(true)
    const [newUserId, setNewUserId] = useState('')
    const [adding, setAdding] = useState(false)

    const loadMembers = async () => {
        setLoading(true)
        try {
            const data = await membersApi.getMembers(boardId)
            setMembers(data)
        } catch {
            setMembers([])
        }
        setLoading(false)
    }

    useEffect(() => {
        if (open) loadMembers()
    }, [open, boardId])

    const handleAddMember = async () => {
        if (!newUserId.trim()) return
        setAdding(true)
        try {
            await membersApi.addMember(boardId, {userId: newUserId.trim(), schemeEditor: true})
            setNewUserId('')
            await loadMembers()
        } catch {
            // error
        }
        setAdding(false)
    }

    const handleRemoveMember = async (userId: string) => {
        try {
            await membersApi.removeMember(boardId, userId)
            await loadMembers()
        } catch {
            // error
        }
    }

    const handleUpdateRole = async (userId: string, role: 'admin' | 'editor' | 'viewer') => {
        try {
            await membersApi.updateMember(boardId, userId, {
                schemeAdmin: role === 'admin',
                schemeEditor: role === 'editor',
                schemeViewer: role === 'viewer',
            })
            await loadMembers()
        } catch {
            // error
        }
    }

    const getRoleLabel = (member: BoardMember) => {
        if (member.schemeAdmin) return 'Admin'
        if (member.schemeEditor) return 'Editor'
        if (member.schemeViewer) return 'Viewer'
        return 'Member'
    }

    const getRoleIcon = (member: BoardMember) => {
        if (member.schemeAdmin) return Shield
        if (member.schemeEditor) return Pencil
        return Eye
    }

    return (
        <Dialog open={open} onClose={onClose} title="Board Members" maxWidth="max-w-md">
            <div className="p-5">
                {/* Add member */}
                <div className="flex items-center gap-2 mb-4">
                    <Input
                        value={newUserId}
                        onChange={(e) => setNewUserId(e.target.value)}
                        placeholder="User ID"
                        className="flex-1 h-9 text-sm"
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddMember() }}
                    />
                    <Button
                        size="small"
                        filled
                        onClick={handleAddMember}
                        disabled={adding || !newUserId.trim()}
                        icon={<UserPlus size={14} />}
                    >
                        Add
                    </Button>
                </div>

                {/* Member list */}
                {loading ? (
                    <div className="text-sm text-center-fg/50 py-4">Loading...</div>
                ) : (
                    <div className="space-y-1">
                        {members.map((member) => {
                            const RoleIcon = getRoleIcon(member)
                            return (
                                <div key={member.userId} className="flex items-center gap-3 h-10 px-2 rounded hover:bg-hover">
                                    <div className="w-7 h-7 rounded-full bg-button-bg/20 flex items-center justify-center text-xs font-bold text-button-bg shrink-0">
                                        {member.userId.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm truncate">{member.userId}</div>
                                    </div>

                                    {/* Role selector */}
                                    <select
                                        value={member.schemeAdmin ? 'admin' : member.schemeEditor ? 'editor' : 'viewer'}
                                        onChange={(e) => handleUpdateRole(member.userId, e.target.value as any)}
                                        className="text-xs bg-transparent border border-border-default rounded px-2 py-1 cursor-pointer outline-none"
                                    >
                                        <option value="admin">Admin</option>
                                        <option value="editor">Editor</option>
                                        <option value="viewer">Viewer</option>
                                    </select>

                                    <button
                                        onClick={() => handleRemoveMember(member.userId)}
                                        className="p-1 rounded text-center-fg/30 hover:text-error hover:bg-error/10 transition-colors cursor-pointer"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            )
                        })}
                        {members.length === 0 && (
                            <div className="text-sm text-center-fg/40 text-center py-4">
                                No members yet
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Dialog>
    )
}
