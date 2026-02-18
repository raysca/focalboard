import React, {useState, useEffect, useRef} from 'react'
import {UserPlus, Shield, Pencil, MessageSquare, Eye, Trash2, LogOut} from 'lucide-react'
import {Dialog} from '../ui/Dialog'
import {Button} from '../ui/Button'
import {membersApi} from '../../api/members'
import {api} from '../../api/client'
import {DEFAULT_TEAM_ID} from '../../lib/constants'
import {useUserSearchQuery, getUserDisplay} from '../../hooks/useUsers'
import {useMeQuery} from '../../hooks/useAuth'
import type {BoardMember, User} from '../../api/types'

interface MembersDialogProps {
    open: boolean
    onClose: () => void
    boardId: string
}

function getRoleLabel(member: BoardMember): 'admin' | 'editor' | 'commenter' | 'viewer' {
    if (member.schemeAdmin) return 'admin'
    if (member.schemeEditor) return 'editor'
    if (member.schemeCommenter) return 'commenter'
    return 'viewer'
}

function roleToFlags(role: string) {
    return {
        schemeAdmin: role === 'admin',
        schemeEditor: role === 'editor',
        schemeCommenter: role === 'commenter' || role === 'editor',
        schemeViewer: true,
    }
}

const ROLE_ICONS: Record<string, React.ElementType> = {
    admin: Shield,
    editor: Pencil,
    commenter: MessageSquare,
    viewer: Eye,
}

export function MembersDialog({open, onClose, boardId}: MembersDialogProps) {
    const {data: me} = useMeQuery()
    const [members, setMembers] = useState<BoardMember[]>([])
    const [userMap, setUserMap] = useState<Record<string, User>>({})
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [showDropdown, setShowDropdown] = useState(false)
    const [adding, setAdding] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const {data: searchResults = []} = useUserSearchQuery(searchQuery, searchQuery.length >= 1)

    const memberUserIds = new Set(members.map(m => m.userId))
    const filteredResults = (searchResults as User[]).filter(u => !memberUserIds.has(u.id))

    const currentUserMember = members.find(m => m.userId === me?.id)
    const isAdmin = currentUserMember?.schemeAdmin ?? false
    const adminCount = members.filter(m => m.schemeAdmin).length
    const isOnlyAdmin = isAdmin && adminCount <= 1

    const loadMembers = async () => {
        setLoading(true)
        try {
            const data = await membersApi.getMembers(boardId)
            setMembers(data)
            if (data.length > 0) {
                try {
                    const users = await api.post<User[]>(`/teams/${DEFAULT_TEAM_ID}/users`, data.map((m: BoardMember) => m.userId))
                    const map: Record<string, User> = {}
                    users.forEach((u: User) => { map[u.id] = u })
                    setUserMap(map)
                } catch {}
            }
        } catch {
            setMembers([])
        }
        setLoading(false)
    }

    useEffect(() => {
        if (open) {
            loadMembers()
            setSearchQuery('')
            setSelectedUser(null)
            setError(null)
        }
    }, [open, boardId])

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const handleSelectUser = (user: User) => {
        setSelectedUser(user)
        setSearchQuery(user.username || user.email || '')
        setShowDropdown(false)
    }

    const handleAddMember = async () => {
        if (!selectedUser) return
        setAdding(true)
        setError(null)
        try {
            await membersApi.addMember(boardId, {userId: selectedUser.id, schemeEditor: true})
            setSearchQuery('')
            setSelectedUser(null)
            await loadMembers()
        } catch {
            setError('Failed to add member. They may already be a member.')
        }
        setAdding(false)
    }

    const handleRemoveMember = async (userId: string) => {
        setError(null)
        try {
            await membersApi.removeMember(boardId, userId)
            await loadMembers()
        } catch {
            setError('Cannot remove member. There must be at least one admin.')
        }
    }

    const handleUpdateRole = async (userId: string, role: string) => {
        setError(null)
        try {
            await membersApi.updateMember(boardId, userId, roleToFlags(role))
            await loadMembers()
        } catch {
            setError('Failed to update role.')
        }
    }

    const handleLeave = async () => {
        if (!me) return
        setError(null)
        try {
            await membersApi.leaveBoard(boardId)
            onClose()
        } catch {
            setError('Cannot leave board. You are the only admin.')
        }
    }

    return (
        <Dialog open={open} onClose={onClose} title="Board Members" maxWidth="max-w-md">
            <div className="p-5" data-testid="members-dialog">

                {/* Add member — admin only */}
                {isAdmin && (
                    <div className="mb-4" ref={dropdownRef}>
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value)
                                        setSelectedUser(null)
                                        setShowDropdown(true)
                                    }}
                                    onFocus={() => searchQuery && setShowDropdown(true)}
                                    placeholder="Search by username..."
                                    className="w-full h-9 px-3 text-sm rounded-[var(--radius-default)] border border-border-default bg-white outline-none focus:border-blue-400"
                                    data-testid="member-search-input"
                                    onKeyDown={(e) => { if (e.key === 'Enter' && selectedUser) handleAddMember() }}
                                />
                                {showDropdown && filteredResults.length > 0 && (
                                    <div
                                        className="absolute top-full left-0 right-0 mt-1 bg-white border border-border-default rounded-[var(--radius-default)] shadow-lg z-50 max-h-48 overflow-y-auto"
                                        data-testid="member-search-dropdown"
                                    >
                                        {filteredResults.map(user => {
                                            const {name, initials} = getUserDisplay(user)
                                            return (
                                                <button
                                                    key={user.id}
                                                    onClick={() => handleSelectUser(user)}
                                                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-black/5 text-sm text-left"
                                                    data-testid="member-search-result"
                                                >
                                                    <div className="w-6 h-6 rounded-full bg-button-bg/20 flex items-center justify-center text-xs font-bold text-button-bg shrink-0">
                                                        {initials}
                                                    </div>
                                                    {name}
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                            <Button
                                size="small"
                                filled
                                onClick={handleAddMember}
                                disabled={adding || !selectedUser}
                                icon={<UserPlus size={14} />}
                                data-testid="member-add-button"
                            >
                                Add
                            </Button>
                        </div>
                        {error && (
                            <p className="text-xs text-error mt-1" data-testid="member-error">{error}</p>
                        )}
                    </div>
                )}

                {/* Member list */}
                {loading ? (
                    <div className="text-sm text-center-fg/50 py-4 text-center">Loading...</div>
                ) : (
                    <div className="space-y-1">
                        {members.map((member) => {
                            const user = userMap[member.userId]
                            const {name, initials} = user ? getUserDisplay(user) : {name: member.userId, initials: member.userId.charAt(0).toUpperCase()}
                            const role = getRoleLabel(member)
                            const RoleIcon = ROLE_ICONS[role] ?? Eye
                            const isSelf = member.userId === me?.id

                            return (
                                <div key={member.userId} className="flex items-center gap-3 h-10 px-2 rounded hover:bg-hover" data-testid="member-row">
                                    <div className="w-7 h-7 rounded-full bg-button-bg/20 flex items-center justify-center text-xs font-bold text-button-bg shrink-0">
                                        {initials}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm truncate">
                                            {name}
                                            {isSelf && <span className="ml-1 text-xs text-center-fg/40">(you)</span>}
                                        </div>
                                    </div>

                                    {isAdmin ? (
                                        <select
                                            value={role}
                                            onChange={(e) => handleUpdateRole(member.userId, e.target.value)}
                                            className="text-xs bg-transparent border border-border-default rounded px-2 py-1 cursor-pointer outline-none"
                                            data-testid="member-role-select"
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="editor">Editor</option>
                                            <option value="commenter">Commenter</option>
                                            <option value="viewer">Viewer</option>
                                        </select>
                                    ) : (
                                        <div className="flex items-center gap-1 text-xs text-center-fg/50 px-2">
                                            <RoleIcon size={12} />
                                            <span className="capitalize">{role}</span>
                                        </div>
                                    )}

                                    {isAdmin && !isSelf && (
                                        <button
                                            onClick={() => handleRemoveMember(member.userId)}
                                            className="p-1 rounded text-center-fg/30 hover:text-error hover:bg-error/10 transition-colors"
                                            data-testid="member-remove-button"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                    {(!isAdmin || isSelf) && <div className="w-6" />}
                                </div>
                            )
                        })}
                        {members.length === 0 && (
                            <div className="text-sm text-center-fg/40 text-center py-4">No members yet</div>
                        )}
                    </div>
                )}

                {/* Leave board */}
                {me && currentUserMember && (
                    <div className="mt-4 pt-4 border-t border-border-default">
                        {isOnlyAdmin ? (
                            <p className="text-xs text-center-fg/40" data-testid="leave-board-disabled">
                                Assign another admin before leaving
                            </p>
                        ) : (
                            <button
                                onClick={handleLeave}
                                className="flex items-center gap-2 text-sm text-error/80 hover:text-error transition-colors"
                                data-testid="leave-board-button"
                            >
                                <LogOut size={14} />
                                Leave board
                            </button>
                        )}
                    </div>
                )}
            </div>
        </Dialog>
    )
}
