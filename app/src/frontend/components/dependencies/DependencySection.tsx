import { useState } from 'react'
import {
    useDependencies,
    useCreateDependency,
    useDeleteDependency,
} from '../../hooks/useDependencies'
import { DependencyList } from './DependencyList'
import { AddDependencyModal } from './AddDependencyModal'
import type { CreateDependencyRequest } from '../../../backend/types/dependencies'

interface DependencySectionProps {
    cardId: string
    boardId: string
}

export function DependencySection({ cardId, boardId }: DependencySectionProps) {
    const [showAddModal, setShowAddModal] = useState(false)
    const { data: dependencies, isLoading } = useDependencies(cardId)
    const createMutation = useCreateDependency(cardId)
    const deleteMutation = useDeleteDependency()

    const handleAddDependency = async (request: CreateDependencyRequest) => {
        try {
            await createMutation.mutateAsync(request)
            setShowAddModal(false)
        } catch (error) {
            console.error('Failed to create dependency:', error)
            alert(error instanceof Error ? error.message : 'Failed to create dependency')
        }
    }

    const handleRemoveDependency = async (depId: string) => {
        if (!confirm('Remove this dependency?')) return

        try {
            await deleteMutation.mutateAsync(depId)
        } catch (error) {
            console.error('Failed to delete dependency:', error)
            alert('Failed to delete dependency')
        }
    }

    if (isLoading) {
        return (
            <div className="dependency-section">
                <div className="text-sm text-gray-500">Loading dependencies...</div>
            </div>
        )
    }

    // Group dependencies by type
    const grouped = {
        blockedBy: dependencies?.filter((d) => d.dependencyType === 'blocked_by') || [],
        blocking: dependencies?.filter((d) => d.dependencyType === 'blocks') || [],
        related: dependencies?.filter((d) => d.dependencyType === 'related') || [],
        duplicates: dependencies?.filter((d) => d.dependencyType === 'duplicate') || [],
        parent: dependencies?.find((d) => d.dependencyType === 'parent'),
        children: dependencies?.filter((d) => d.dependencyType === 'child') || [],
    }

    const hasAnyDependencies = Object.values(grouped).some((v) =>
        Array.isArray(v) ? v.length > 0 : !!v
    )

    return (
        <div className="dependency-section mt-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Dependencies</h3>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                    + Add
                </button>
            </div>

            {!hasAnyDependencies && (
                <p className="text-gray-500 text-center py-8 text-sm">
                    No dependencies yet
                </p>
            )}

            {grouped.blockedBy.length > 0 && (
                <DependencyList
                    title="⛔ Blocked by"
                    type="blocked_by"
                    items={grouped.blockedBy}
                    onRemove={handleRemoveDependency}
                    variant="warning"
                />
            )}

            {grouped.blocking.length > 0 && (
                <DependencyList
                    title="🚫 Blocking"
                    type="blocks"
                    items={grouped.blocking}
                    onRemove={handleRemoveDependency}
                    variant="info"
                />
            )}

            {grouped.related.length > 0 && (
                <DependencyList
                    title="🔗 Related"
                    type="related"
                    items={grouped.related}
                    onRemove={handleRemoveDependency}
                />
            )}

            {grouped.duplicates.length > 0 && (
                <DependencyList
                    title="👥 Duplicates"
                    type="duplicate"
                    items={grouped.duplicates}
                    onRemove={handleRemoveDependency}
                />
            )}

            {grouped.parent && (
                <DependencyList
                    title="⬆️ Parent"
                    type="parent"
                    items={[grouped.parent]}
                    onRemove={handleRemoveDependency}
                />
            )}

            {grouped.children.length > 0 && (
                <DependencyList
                    title="⬇️ Children"
                    type="child"
                    items={grouped.children}
                    onRemove={handleRemoveDependency}
                />
            )}

            {showAddModal && (
                <AddDependencyModal
                    sourceCardId={cardId}
                    boardId={boardId}
                    onAdd={handleAddDependency}
                    onClose={() => setShowAddModal(false)}
                />
            )}
        </div>
    )
}
