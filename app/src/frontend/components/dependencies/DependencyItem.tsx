import type { CardDependencyWithCards } from '../../../backend/types/dependencies'

interface DependencyItemProps {
    dependency: CardDependencyWithCards
    onRemove: () => void
}

export function DependencyItem({ dependency, onRemove }: DependencyItemProps) {
    // Show the target card (the one this card depends on/is related to)
    const card = dependency.targetCard

    if (!card) {
        return (
            <div className="text-sm text-center-fg/40 italic px-3 py-2">Card not found</div>
        )
    }

    const statusIcon = card.isCompleted ? '✅' : '⏳'

    return (
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius-default)] hover:bg-center-bg/50 group transition-colors">
            <a
                href={`/board/${card.boardId}?card=${card.id}`}
                className="flex items-center gap-2.5 flex-1 min-w-0 no-underline text-inherit"
                onClick={(e) => {
                    // Prevent default and handle navigation if needed
                    // This could be replaced with proper routing
                }}
            >
                <span className="text-lg flex-shrink-0">{card.icon || '📄'}</span>
                <div className="flex-1 min-w-0">
                    <div className="truncate font-medium text-sm text-center-fg">{card.title}</div>
                    {card.boardTitle && (
                        <div className="text-xs text-center-fg/50 truncate mt-0.5">
                            {card.boardTitle}
                        </div>
                    )}
                </div>
                <span className="text-base flex-shrink-0 opacity-60">{statusIcon}</span>
            </a>
            <button
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-[var(--radius-default)] hover:bg-error/10 transition-all flex-shrink-0"
                onClick={onRemove}
                title="Remove dependency"
            >
                <svg
                    className="w-4 h-4 text-error"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                    />
                </svg>
            </button>
        </div>
    )
}
