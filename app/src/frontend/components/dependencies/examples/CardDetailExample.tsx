/**
 * Example: How to integrate DependencySection into a card detail view
 *
 * This file shows how to add the dependency section to your card detail page.
 */

import { DependencySection } from '../DependencySection'

interface CardDetailProps {
    cardId: string
    boardId: string
}

export function CardDetailExample({ cardId, boardId }: CardDetailProps) {
    return (
        <div className="card-detail-page max-w-4xl mx-auto p-6">
            {/* Card Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Card Title</h1>
                <div className="text-sm text-gray-500">
                    Created on {new Date().toLocaleDateString()}
                </div>
            </div>

            {/* Card Properties */}
            <div className="mb-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                        <option>Not Started</option>
                        <option>In Progress</option>
                        <option>Completed</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Assignee
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                        <option>Unassigned</option>
                        <option>John Doe</option>
                        <option>Jane Smith</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Due Date
                    </label>
                    <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                </div>
            </div>

            {/* Card Description */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                </label>
                <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={5}
                    placeholder="Add a description..."
                />
            </div>

            {/* 🎯 DEPENDENCY SECTION - Add this to your card detail view */}
            <DependencySection cardId={cardId} boardId={boardId} />

            {/* Card Comments */}
            <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Comments</h3>
                <div className="space-y-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0" />
                            <div className="flex-1">
                                <div className="font-medium text-sm">John Doe</div>
                                <div className="text-sm text-gray-600 mt-1">
                                    Great work on this!
                                </div>
                                <div className="text-xs text-gray-400 mt-1">2 hours ago</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
