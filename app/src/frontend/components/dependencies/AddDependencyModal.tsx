import { useState, useEffect } from 'react'
import { useValidateDependency } from '../../hooks/useDependencies'
import type {
    CreateDependencyRequest,
    DependencyType,
} from '../../../backend/types/dependencies'

interface AddDependencyModalProps {
    sourceCardId: string
    boardId: string
    onAdd: (request: CreateDependencyRequest) => Promise<void>
    onClose: () => void
}

const DEPENDENCY_TYPE_OPTIONS = [
    {
        value: 'blocks' as DependencyType,
        label: '🚫 Blocks',
        description: 'This card blocks another card from being completed',
    },
    {
        value: 'related' as DependencyType,
        label: '🔗 Related',
        description: 'This card is related to another card',
    },
    {
        value: 'duplicate' as DependencyType,
        label: '👥 Duplicate',
        description: 'This card is a duplicate of another card',
    },
    {
        value: 'parent' as DependencyType,
        label: '⬆️ Parent',
        description: 'This card is a parent/epic of another card',
    },
]

export function AddDependencyModal({
    sourceCardId,
    boardId,
    onAdd,
    onClose,
}: AddDependencyModalProps) {
    const [dependencyType, setDependencyType] = useState<DependencyType>('blocks')
    const [targetCardId, setTargetCardId] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [enforceBlocking, setEnforceBlocking] = useState(false)
    const [notes, setNotes] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [validationError, setValidationError] = useState<string | null>(null)

    const validateMutation = useValidateDependency()

    // Mock card search results - in real implementation, this would use an API
    const mockCards = [
        {
            id: 'card_1',
            title: 'Setup development environment',
            boardTitle: 'Development',
            icon: '⚙️',
        },
        {
            id: 'card_2',
            title: 'Design database schema',
            boardTitle: 'Development',
            icon: '🗄️',
        },
        {
            id: 'card_3',
            title: 'Implement API endpoints',
            boardTitle: 'Development',
            icon: '🔌',
        },
        {
            id: 'card_4',
            title: 'Write documentation',
            boardTitle: 'Development',
            icon: '📝',
        },
        {
            id: 'card_5',
            title: 'Marketing launch plan',
            boardTitle: 'Marketing',
            icon: '📢',
        },
    ]

    const searchResults = mockCards.filter(
        (card) =>
            card.id !== sourceCardId &&
            (searchQuery === '' ||
                card.title.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    // Validate when type or target changes
    useEffect(() => {
        if (targetCardId) {
            validateDependency()
        }
    }, [dependencyType, targetCardId])

    const validateDependency = async () => {
        if (!targetCardId) return

        try {
            const result = await validateMutation.mutateAsync({
                sourceCardId,
                targetCardId,
                dependencyType,
            })

            if (!result.valid) {
                setValidationError(result.error || 'Invalid dependency')
            } else {
                setValidationError(null)
            }
        } catch (error) {
            setValidationError('Validation failed')
        }
    }

    const handleSubmit = async () => {
        if (!targetCardId) {
            alert('Please select a card')
            return
        }

        if (validationError) {
            alert(validationError)
            return
        }

        setIsSubmitting(true)

        try {
            await onAdd({
                sourceCardId,
                targetCardId,
                dependencyType,
                metadata: {
                    enforceBlocking: dependencyType === 'blocks' ? enforceBlocking : undefined,
                    notes: notes.trim() || undefined,
                },
            })
        } catch (error) {
            console.error('Failed to add dependency:', error)
            alert(error instanceof Error ? error.message : 'Failed to add dependency')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Add Dependency</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg
                            className="w-6 h-6"
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

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Dependency Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Dependency Type
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {DEPENDENCY_TYPE_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setDependencyType(option.value)}
                                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                                        dependencyType === option.value
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="font-medium text-sm">{option.label}</div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {option.description}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Search Cards */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Search Cards
                        </label>
                        <div className="relative">
                            <input
                                type="search"
                                placeholder="Type to search cards..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <svg
                                className="absolute right-3 top-2.5 w-5 h-5 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </div>
                    </div>

                    {/* Search Results */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Card ({searchResults.length} found)
                        </label>
                        <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
                            {searchResults.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 text-sm">
                                    No cards found
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {searchResults.map((card) => (
                                        <button
                                            key={card.id}
                                            type="button"
                                            onClick={() => setTargetCardId(card.id)}
                                            className={`w-full p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                                                targetCardId === card.id ? 'bg-blue-50' : ''
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                checked={targetCardId === card.id}
                                                onChange={() => setTargetCardId(card.id)}
                                                className="flex-shrink-0"
                                            />
                                            <span className="text-xl flex-shrink-0">
                                                {card.icon}
                                            </span>
                                            <div className="flex-1 text-left min-w-0">
                                                <div className="font-medium text-sm truncate">
                                                    {card.title}
                                                </div>
                                                <div className="text-xs text-gray-500 truncate">
                                                    {card.boardTitle}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Validation Error */}
                    {validationError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-start gap-2">
                                <svg
                                    className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <div className="text-sm text-red-700">{validationError}</div>
                            </div>
                        </div>
                    )}

                    {/* Options */}
                    {dependencyType === 'blocks' && (
                        <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={enforceBlocking}
                                    onChange={(e) => setEnforceBlocking(e.target.checked)}
                                    className="mt-1 flex-shrink-0"
                                />
                                <div>
                                    <div className="font-medium text-sm">Enforce blocking</div>
                                    <div className="text-xs text-gray-600 mt-0.5">
                                        Prevent the blocked card from being completed until this
                                        card is done
                                    </div>
                                </div>
                            </label>
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notes (optional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add any notes about this dependency..."
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!targetCardId || isSubmitting || !!validationError}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSubmitting ? 'Adding...' : 'Add Dependency'}
                    </button>
                </div>
            </div>
        </div>
    )
}
