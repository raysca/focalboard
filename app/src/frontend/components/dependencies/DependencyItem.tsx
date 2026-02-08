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
            <div className="text-sm text-gray-400 italic">Card not found</div>
        )
    }

    const statusIcon = card.isCompleted ? '✅' : '⏳'

    return (
        <div className="flex items-center gap-2 p-2 rounded hover:bg-white/70 group transition-colors">
            <a
                href={`/board/${card.boardId}?card=${card.id}`}
                className="flex items-center gap-2 flex-1 min-w-0 no-underline text-inherit"
                onClick={(e) => {
                    // Prevent default and handle navigation if needed
                    // This could be replaced with proper routing
                }}
            >
                <span className="text-xl flex-shrink-0">{card.icon || '📄'}</span>
                <div className="flex-1 min-w-0">
                    <div className="truncate font-medium text-sm">{card.title}</div>
                    {card.boardTitle && (
                        <div className="text-xs text-gray-500 truncate">
                            {card.boardTitle}
                        </div>
                    )}
                </div>
                <span className="text-lg flex-shrink-0">{statusIcon}</span>
            </a>
            <button
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 transition-opacity flex-shrink-0"
                onClick={onRemove}
                title="Remove dependency"
            >
                <svg
                    className="w-4 h-4 text-red-600"
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
