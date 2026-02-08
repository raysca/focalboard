import { useDependencies } from '../../hooks/useDependencies'

interface DependencyBadgeProps {
    cardId: string
    variant?: 'compact' | 'full'
}

export function DependencyBadge({ cardId, variant = 'compact' }: DependencyBadgeProps) {
    const { data: dependencies, isLoading } = useDependencies(cardId)

    if (isLoading || !dependencies || dependencies.length === 0) {
        return null
    }

    // Count dependencies by type
    const blockedBy = dependencies.filter((d) => d.dependencyType === 'blocked_by').length
    const blocking = dependencies.filter((d) => d.dependencyType === 'blocks').length
    const related = dependencies.filter((d) => d.dependencyType === 'related').length
    const duplicates = dependencies.filter((d) => d.dependencyType === 'duplicate').length

    const totalDeps = dependencies.length
    const hasBlockers = blockedBy > 0
    const isBlocking = blocking > 0

    if (variant === 'compact') {
        return (
            <div className="flex items-center gap-1">
                {/* Blocked indicator */}
                {hasBlockers && (
                    <div
                        className="w-2 h-2 rounded-full bg-red-500"
                        title={`Blocked by ${blockedBy} card${blockedBy > 1 ? 's' : ''}`}
                    />
                )}

                {/* Blocking indicator */}
                {isBlocking && (
                    <div
                        className="w-2 h-2 rounded-full bg-yellow-500"
                        title={`Blocking ${blocking} card${blocking > 1 ? 's' : ''}`}
                    />
                )}

                {/* Related/other dependencies */}
                {(related > 0 || duplicates > 0) && !hasBlockers && !isBlocking && (
                    <div className="w-2 h-2 rounded-full bg-blue-500" title="Has dependencies" />
                )}
            </div>
        )
    }

    // Full variant - shows detailed badges
    return (
        <div className="flex flex-wrap items-center gap-1.5">
            {hasBlockers && (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                    <span>⛔</span>
                    <span>Blocked ({blockedBy})</span>
                </div>
            )}

            {isBlocking && (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                    <span>🚫</span>
                    <span>Blocking ({blocking})</span>
                </div>
            )}

            {related > 0 && (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    <span>🔗</span>
                    <span>{related}</span>
                </div>
            )}

            {duplicates > 0 && (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                    <span>👥</span>
                    <span>{duplicates}</span>
                </div>
            )}
        </div>
    )
}
