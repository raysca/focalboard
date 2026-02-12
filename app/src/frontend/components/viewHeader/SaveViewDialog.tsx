import React, {useState} from 'react'
import {User, Users, FileText} from 'lucide-react'
import type {Board, BoardView, ViewVisibility} from '../../api/types'

interface SaveViewDialogProps {
    open: boolean
    onClose: () => void
    board: Board
    currentView: BoardView
    onSave: (viewName: string, visibility: ViewVisibility) => void
}

export function SaveViewDialog({open, onClose, board, currentView, onSave}: SaveViewDialogProps) {
    const [viewName, setViewName] = useState('')
    const [visibility, setVisibility] = useState<ViewVisibility>('personal')

    const handleSave = () => {
        if (!viewName.trim()) return
        onSave(viewName.trim(), visibility)
        setViewName('')
        setVisibility('personal')
        onClose()
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-center-bg border border-border-default rounded-[var(--radius-default)] shadow-elevation-3 w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-lg font-semibold mb-4">Save Current View</h2>

                {/* Preview what will be saved */}
                <div className="mb-4 p-3 bg-hover rounded">
                    <p className="text-sm text-center-fg/60 mb-2">This will save:</p>
                    <ul className="text-xs space-y-1">
                        <li>✓ View type: {currentView.fields?.viewType || 'board'}</li>
                        {currentView.fields?.filter && currentView.fields.filter.filters.length > 0 && (
                            <li>✓ {currentView.fields.filter.filters.length} filter(s)</li>
                        )}
                        {currentView.fields?.sortOptions && currentView.fields.sortOptions.length > 0 && (
                            <li>✓ {currentView.fields.sortOptions.length} sort rule(s)</li>
                        )}
                        {currentView.fields?.groupById && (
                            <li>✓ Grouped by {board.cardProperties?.find(p => p.id === currentView.fields?.groupById)?.name}</li>
                        )}
                        <li>✓ Visible properties</li>
                    </ul>
                </div>

                {/* View name input */}
                <div className="mb-4">
                    <label className="text-sm font-medium block mb-1">View Name</label>
                    <input
                        type="text"
                        value={viewName}
                        onChange={(e) => setViewName(e.target.value)}
                        placeholder="e.g., My Tasks, Sprint 1, High Priority"
                        className="w-full px-3 py-2 border border-border-default rounded bg-transparent text-sm outline-none focus:border-button-bg"
                        autoFocus
                    />
                </div>

                {/* Visibility selector */}
                <div className="mb-6">
                    <label className="text-sm font-medium block mb-2">Visibility</label>
                    <div className="space-y-2">
                        <label className={`flex items-start gap-3 p-3 border rounded cursor-pointer hover:bg-hover transition-colors ${visibility === 'personal' ? 'border-button-bg bg-button-bg/5' : 'border-border-default'}`}>
                            <input
                                type="radio"
                                name="visibility"
                                value="personal"
                                checked={visibility === 'personal'}
                                onChange={() => setVisibility('personal')}
                                className="mt-0.5"
                            />
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <User size={14} />
                                    <span className="text-sm font-medium">Personal</span>
                                </div>
                                <p className="text-xs text-center-fg/60">Only you can see this view</p>
                            </div>
                        </label>

                        <label className={`flex items-start gap-3 p-3 border rounded cursor-pointer hover:bg-hover transition-colors ${visibility === 'team' ? 'border-button-bg bg-button-bg/5' : 'border-border-default'}`}>
                            <input
                                type="radio"
                                name="visibility"
                                value="team"
                                checked={visibility === 'team'}
                                onChange={() => setVisibility('team')}
                                className="mt-0.5"
                            />
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <Users size={14} />
                                    <span className="text-sm font-medium">Team/Shared</span>
                                </div>
                                <p className="text-xs text-center-fg/60">All board members can see and use this view</p>
                            </div>
                        </label>

                        <label className={`flex items-start gap-3 p-3 border rounded cursor-pointer hover:bg-hover transition-colors ${visibility === 'template' ? 'border-button-bg bg-button-bg/5' : 'border-border-default'}`}>
                            <input
                                type="radio"
                                name="visibility"
                                value="template"
                                checked={visibility === 'template'}
                                onChange={() => setVisibility('template')}
                                className="mt-0.5"
                            />
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <FileText size={14} />
                                    <span className="text-sm font-medium">Template</span>
                                </div>
                                <p className="text-xs text-center-fg/60">Others can duplicate but not modify</p>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm rounded hover:bg-hover transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!viewName.trim()}
                        className="px-4 py-2 text-sm rounded bg-button-bg text-button-fg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Save View
                    </button>
                </div>
            </div>
        </div>
    )
}
