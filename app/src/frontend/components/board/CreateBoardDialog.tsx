import React, {useState} from 'react'
import {Dialog} from '../ui/Dialog'
import {Button} from '../ui/Button'
import {Input} from '../ui/Input'
import {useToast} from '../ui/Toast'
import {useCreateBoardMutation} from '../../hooks/useBoards'
import {useNavigate} from '@tanstack/react-router'
import {UserMultiSelect} from '../ui/UserMultiSelect'
import {Users, Lock, Globe} from 'lucide-react'

interface CreateBoardDialogProps {
    open: boolean
    onClose: () => void
    teamId: string
}

const BOARD_ICONS = ['📋', '🚀', '🎯', '💡', '⚡', '🔥', '✨', '🎨', '🔧', '📊', '🌟', '💼', '🏆', '🎪', '🧩', '🎭']

const TEMPLATES = [
    {
        id: 'blank',
        name: 'Blank Board',
        description: 'Start from scratch',
        icon: '📋',
        properties: [
            {
                id: 'prop-status',
                name: 'Status',
                type: 'select' as const,
                options: [
                    {id: 'status-todo', value: 'To Do', color: 'default'},
                    {id: 'status-in-progress', value: 'In Progress', color: 'yellow'},
                    {id: 'status-done', value: 'Done', color: 'green'},
                ],
            },
        ],
    },
    {
        id: 'kanban',
        name: 'Kanban Board',
        description: 'Visualize workflow',
        icon: '🎯',
        properties: [
            {
                id: 'prop-status',
                name: 'Status',
                type: 'select' as const,
                options: [
                    {id: 'status-todo', value: 'To Do', color: 'default'},
                    {id: 'status-in-progress', value: 'In Progress', color: 'yellow'},
                    {id: 'status-blocked', value: 'Blocked', color: 'red'},
                    {id: 'status-done', value: 'Done', color: 'green'},
                ],
            },
            {
                id: 'prop-assignee',
                name: 'Assignee',
                type: 'person' as const,
                options: [],
            },
        ],
    },
]

export function CreateBoardDialog({open, onClose, teamId}: CreateBoardDialogProps) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [icon, setIcon] = useState('📋')
    const [visibility, setVisibility] = useState<'O' | 'P'>('O')
    const [invitedUserIds, setInvitedUserIds] = useState<string[]>([])
    const [selectedTemplate, setSelectedTemplate] = useState('blank')
    const {addToast} = useToast()
    const navigate = useNavigate()
    const createBoard = useCreateBoardMutation(teamId)

    const handleClose = () => {
        setTitle('')
        setDescription('')
        setIcon('📋')
        setVisibility('O')
        setInvitedUserIds([])
        setSelectedTemplate('blank')
        onClose()
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!title.trim()) {
            addToast('Please enter a board title', 'error')
            return
        }

        try {
            const template = TEMPLATES.find((t) => t.id === selectedTemplate) || TEMPLATES[0]!
            const board = await createBoard.mutateAsync({
                teamId,
                title: title.trim(),
                description: description.trim(),
                icon,
                type: visibility,
                showDescription: !!description,
                isTemplate: false,
                cardProperties: template.properties,
                initialMembers: invitedUserIds,
            })

            addToast('Board created successfully', 'success')
            handleClose()
            navigate({to: '/board/$boardId', params: {boardId: board.id}})
        } catch (error: any) {
            // Handle specific error messages from backend
            const errorMessage = error?.message || 'Failed to create board'
            addToast(errorMessage, 'error')
            console.error('Failed to create board:', error)
        }
    }

    return (
        <Dialog open={open} onClose={handleClose} title="Create New Board" maxWidth="max-w-xl">
            <form onSubmit={handleSubmit} className="p-5">
                <div className="flex gap-4">
                    <div className="flex-shrink-0">
                        <label className="block text-xs font-semibold text-center-fg/70 mb-2 uppercase tracking-wide">
                            Icon
                        </label>
                        <div className="relative group">
                            <div className="w-12 h-12 flex items-center justify-center text-3xl bg-center-fg/5 rounded-[var(--radius-default)] border border-border-default">
                                {icon}
                            </div>
                            <div className="absolute top-full left-0 mt-1 w-[280px] bg-center-bg border border-border-default rounded-[var(--radius-default)] shadow-elevation-3 p-2 hidden group-hover:block z-50">
                                <div className="grid grid-cols-6 gap-1">
                                    {BOARD_ICONS.map((emoji) => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            onClick={() => setIcon(emoji)}
                                            className={`w-10 h-10 flex items-center justify-center text-xl rounded hover:bg-hover transition-colors ${icon === emoji ? 'bg-button-bg/20' : ''
                                                }`}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 space-y-5">
                        <div>
                            <label htmlFor="title" className="block text-xs font-semibold text-center-fg/70 mb-2 uppercase tracking-wide">
                                Board Name *
                            </label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Q1 Roadmap"
                                className="w-full"
                                data-testid="board-title-input"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-center-fg/70 mb-2 uppercase tracking-wide">
                                Visibility
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setVisibility('O')}
                                    className={`p-2 rounded border text-left transition-all ${visibility === 'O'
                                        ? 'border-button-bg bg-button-bg/5'
                                        : 'border-border-default hover:border-center-fg/30'
                                        }`}
                                    data-testid="visibility-workspace"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Globe size={14} className={visibility === 'O' ? 'text-button-bg' : 'text-center-fg/60'} />
                                        <div className="text-sm font-medium">Workspace</div>
                                    </div>
                                    <div className="text-xs text-center-fg/60">Visible to all team members</div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setVisibility('P')}
                                    className={`p-2 rounded border text-left transition-all ${visibility === 'P'
                                        ? 'border-button-bg bg-button-bg/5'
                                        : 'border-border-default hover:border-center-fg/30'
                                        }`}
                                    data-testid="visibility-private"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Lock size={14} className={visibility === 'P' ? 'text-button-bg' : 'text-center-fg/60'} />
                                        <div className="text-sm font-medium">Private</div>
                                    </div>
                                    <div className="text-xs text-center-fg/60">Only you and invited members</div>
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-center-fg/70 mb-2 uppercase tracking-wide flex items-center gap-1">
                                <Users size={12} />
                                Invite Members
                            </label>
                            <UserMultiSelect
                                value={invitedUserIds}
                                onChange={setInvitedUserIds}
                                placeholder={visibility === 'P' ? "Add members to access this private board..." : "Optional: Add members to notify them..."}
                            />
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-xs font-semibold text-center-fg/70 mb-2 uppercase tracking-wide">
                                Description
                            </label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What's this board for?"
                                rows={2}
                                className="w-full px-3 py-2 text-sm bg-transparent border border-border-default rounded-[var(--radius-default)] focus:outline-none focus:ring-1 focus:ring-button-bg focus:border-button-bg resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-center-fg/70 mb-2 uppercase tracking-wide">
                                Template
                            </label>
                            <div className="flex gap-2">
                                {TEMPLATES.map((t) => (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => setSelectedTemplate(t.id)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selectedTemplate === t.id
                                            ? 'bg-center-fg text-center-bg border-center-fg'
                                            : 'bg-transparent text-center-fg border-border-default hover:border-center-fg/50'
                                            }`}
                                    >
                                        {t.icon} {t.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-5 border-t border-border-default mt-5">
                    <Button type="button" emphasis="gray" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button type="submit" filled disabled={!title.trim() || createBoard.isPending} data-testid="create-board-submit">
                        {createBoard.isPending ? 'Creating...' : 'Create Board'}
                    </Button>
                </div>
            </form>
        </Dialog >
    )
}
