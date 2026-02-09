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
            <div className="flex items-center gap-1.5">
                {/* Blocked indicator */}
                {hasBlockers && (
                    <div
                        className="w-2 h-2 rounded-full bg-error shadow-sm"
                        title={`Blocked by ${blockedBy} card${blockedBy > 1 ? 's' : ''}`}
                    />
                )}

                {/* Blocking indicator */}
                {isBlocking && (
                    <div
                        className="w-2 h-2 rounded-full bg-warn shadow-sm"
                        title={`Blocking ${blocking} card${blocking > 1 ? 's' : ''}`}
                    />
                )}

                {/* Related/other dependencies */}
                {(related > 0 || duplicates > 0) && !hasBlockers && !isBlocking && (
                    <div className="w-2 h-2 rounded-full bg-link shadow-sm" title="Has dependencies" />
                )}
            </div>
        )
    }

    // Full variant - shows detailed badges
    return (
        <div className="flex flex-wrap items-center gap-2">
            {hasBlockers && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-error/10 text-error rounded-[var(--radius-default)] text-xs font-medium border border-error/20">
                    <span>⛔</span>
                    <span>Blocked ({blockedBy})</span>
                </div>
            )}

            {isBlocking && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-warn/10 text-warn rounded-[var(--radius-default)] text-xs font-medium border border-warn/20">
                    <span>🚫</span>
                    <span>Blocking ({blocking})</span>
                </div>
            )}

            {related > 0 && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-link/10 text-link rounded-[var(--radius-default)] text-xs font-medium border border-link/20">
                    <span>🔗</span>
                    <span>{related}</span>
                </div>
            )}

            {duplicates > 0 && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-center-fg/10 text-center-fg rounded-[var(--radius-default)] text-xs font-medium border border-center-fg/20">
                    <span>👥</span>
                    <span>{duplicates}</span>
                </div>
            )}
        </div>
    )
}
