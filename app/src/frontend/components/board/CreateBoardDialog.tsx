import React, {useState} from 'react'
import {Dialog} from '../ui/Dialog'
import {Button} from '../ui/Button'
import {Input} from '../ui/Input'
import {useToast} from '../ui/Toast'
import {useCreateBoardMutation} from '../../hooks/useBoards'
import {useNavigate} from '@tanstack/react-router'

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
        id: 'personal',
        name: 'Personal Tasks',
        description: 'Track your daily tasks',
        icon: '✅',
        properties: [
            {
                id: 'prop-status',
                name: 'Status',
                type: 'select' as const,
                options: [
                    {id: 'status-todo', value: 'To Do', color: 'default'},
                    {id: 'status-in-progress', value: 'Doing', color: 'blue'},
                    {id: 'status-done', value: 'Done', color: 'green'},
                ],
            },
            {
                id: 'prop-priority',
                name: 'Priority',
                type: 'select' as const,
                options: [
                    {id: 'priority-high', value: 'High', color: 'red'},
                    {id: 'priority-medium', value: 'Medium', color: 'yellow'},
                    {id: 'priority-low', value: 'Low', color: 'blue'},
                ],
            },
            {
                id: 'prop-due-date',
                name: 'Due Date',
                type: 'date' as const,
                options: [],
            },
        ],
    },
    {
        id: 'project',
        name: 'Project Tracker',
        description: 'Manage project milestones',
        icon: '🚀',
        properties: [
            {
                id: 'prop-status',
                name: 'Status',
                type: 'select' as const,
                options: [
                    {id: 'status-backlog', value: 'Backlog', color: 'default'},
                    {id: 'status-planned', value: 'Planned', color: 'purple'},
                    {id: 'status-in-progress', value: 'In Progress', color: 'yellow'},
                    {id: 'status-review', value: 'Review', color: 'blue'},
                    {id: 'status-complete', value: 'Complete', color: 'green'},
                ],
            },
            {
                id: 'prop-assignee',
                name: 'Assignee',
                type: 'person' as const,
                options: [],
            },
            {
                id: 'prop-due-date',
                name: 'Due Date',
                type: 'date' as const,
                options: [],
            },
            {
                id: 'prop-priority',
                name: 'Priority',
                type: 'select' as const,
                options: [
                    {id: 'priority-critical', value: 'Critical', color: 'red'},
                    {id: 'priority-high', value: 'High', color: 'orange'},
                    {id: 'priority-medium', value: 'Medium', color: 'yellow'},
                    {id: 'priority-low', value: 'Low', color: 'blue'},
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
    const [selectedTemplate, setSelectedTemplate] = useState('blank')
    const {addToast} = useToast()
    const navigate = useNavigate()
    const createBoard = useCreateBoardMutation(teamId)

    const handleClose = () => {
        setTitle('')
        setDescription('')
        setIcon('📋')
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
            const template = TEMPLATES.find((t) => t.id === selectedTemplate) || TEMPLATES[0]
            const board = await createBoard.mutateAsync({
                teamId,
                title: title.trim(),
                description: description.trim(),
                icon,
                type: 'private',
                showDescription: !!description,
                isTemplate: false,
                cardProperties: template.properties,
            })

            addToast('Board created successfully', 'success')
            handleClose()
            navigate({to: '/board/$boardId', params: {boardId: board.id}})
        } catch (error) {
            addToast('Failed to create board', 'error')
            console.error('Failed to create board:', error)
        }
    }

    return (
        <Dialog open={open} onClose={handleClose} title="Create New Board" maxWidth="max-w-2xl">
            <form onSubmit={handleSubmit} className="p-5">
                {/* Icon Selector */}
                <div className="mb-5">
                    <label className="block text-xs font-semibold text-center-fg/70 mb-2 uppercase tracking-wide">
                        Board Icon
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {BOARD_ICONS.map((emoji) => (
                            <button
                                key={emoji}
                                type="button"
                                onClick={() => setIcon(emoji)}
                                className={`w-12 h-12 flex items-center justify-center text-2xl rounded-[var(--radius-default)] transition-all ${
                                    icon === emoji
                                        ? 'bg-button-bg/20 border-2 border-button-bg scale-110'
                                        : 'bg-center-fg/5 hover:bg-center-fg/10 border border-transparent'
                                }`}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Board Title */}
                <div className="mb-5">
                    <label htmlFor="title" className="block text-xs font-semibold text-center-fg/70 mb-2 uppercase tracking-wide">
                        Board Title *
                    </label>
                    <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Q1 Marketing Plan"
                        autoFocus
                        className="w-full"
                    />
                </div>

                {/* Description */}
                <div className="mb-5">
                    <label htmlFor="description" className="block text-xs font-semibold text-center-fg/70 mb-2 uppercase tracking-wide">
                        Description (Optional)
                    </label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Add a description to help your team understand this board..."
                        rows={3}
                        className="w-full px-4 py-2.5 text-sm bg-transparent border border-border-default rounded-[var(--radius-default)] focus:outline-none focus:ring-2 focus:ring-button-bg focus:border-transparent resize-none"
                    />
                </div>

                {/* Template Selector */}
                <div className="mb-6">
                    <label className="block text-xs font-semibold text-center-fg/70 mb-3 uppercase tracking-wide">
                        Choose Template
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        {TEMPLATES.map((template) => (
                            <button
                                key={template.id}
                                type="button"
                                onClick={() => setSelectedTemplate(template.id)}
                                className={`p-4 text-left rounded-[var(--radius-default)] border-2 transition-all ${
                                    selectedTemplate === template.id
                                        ? 'border-button-bg bg-button-bg/5'
                                        : 'border-border-default hover:border-border-default/80 hover:bg-hover'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl flex-shrink-0">{template.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-sm text-center-fg mb-0.5">{template.name}</div>
                                        <div className="text-xs text-center-fg/60">{template.description}</div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-3 border-t border-border-default">
                    <Button type="button" emphasis="gray" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button type="submit" filled disabled={!title.trim() || createBoard.isPending}>
                        {createBoard.isPending ? 'Creating...' : 'Create Board'}
                    </Button>
                </div>
            </form>
        </Dialog>
    )
}
