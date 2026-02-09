import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useValidateDependency } from '../../hooks/useDependencies'
import { useBoardDataQuery } from '../../hooks/useBlocks'
import type {
    CreateDependencyRequest,
    DependencyType,
} from '../../../backend/types/dependencies'
import type { Card } from '../../api/types'

interface AddDependencyModalProps {
    sourceCardId: string
    boardId: string
    onAdd: (request: CreateDependencyRequest) => Promise<void>
    onClose: () => void
}

const DEPENDENCY_TYPE_OPTIONS = [
    {
        value: 'blocks' as DependencyType,
        label: 'Blocks',
        icon: '🚫',
        description: 'This card blocks another card from being completed',
    },
    {
        value: 'related' as DependencyType,
        label: 'Related',
        icon: '🔗',
        description: 'This card is related to another card',
    },
    {
        value: 'duplicate' as DependencyType,
        label: 'Duplicate',
        icon: '👥',
        description: 'This card is a duplicate of another card',
    },
    {
        value: 'parent' as DependencyType,
        label: 'Parent',
        icon: '⬆️',
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
    const { data: boardData } = useBoardDataQuery(boardId)

    // Get all cards from the board
    const allCards = (boardData?.cards || []) as Card[]

    const searchResults = allCards.filter(
        (card) =>
            card.id !== sourceCardId &&
            (searchQuery === '' ||
                card.title?.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    // Validate when type or target changes
    useEffect(() => {
        if (targetCardId) {
            validateDependency()
        } else {
            setValidationError(null)
        }
    }, [dependencyType, targetCardId])

    const validateDependency = async () => {
        if (!targetCardId) {
            setValidationError(null)
            return
        }

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
        } catch (error: any) {
            console.error('Validation error:', error)
            setValidationError(error?.message || 'Failed to validate dependency')
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
            className="fixed inset-0 bg-black/50 flex items-start justify-center pt-[10vh] z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-center-bg rounded-[var(--radius-modal)] shadow-elevation-4 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-4">
                    <h2 className="text-xl font-bold text-center-fg">Add Dependency</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded hover:bg-hover transition-colors text-center-fg/50 hover:text-center-fg"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Divider */}
                <div className="h-px bg-border-default mx-6" />

                {/* Content */}
                <div className="p-6 space-y-5">
                    {/* Dependency Type */}
                    <div>
                        <label className="block text-sm font-medium text-center-fg mb-3">
                            Dependency Type
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {DEPENDENCY_TYPE_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setDependencyType(option.value)}
                                    className={`p-3 rounded-[var(--radius-default)] border-2 text-left transition-all ${
                                        dependencyType === option.value
                                            ? 'border-button-bg bg-button-bg/10'
                                            : 'border-border-default hover:bg-hover'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-base">{option.icon}</span>
                                        <span className="font-medium text-sm text-center-fg">{option.label}</span>
                                    </div>
                                    <div className="text-xs text-center-fg/60 leading-tight">
                                        {option.description}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Search Cards */}
                    <div>
                        <label className="block text-sm font-medium text-center-fg mb-2">
                            Search Cards
                        </label>
                        <div className="relative">
                            <input
                                type="search"
                                placeholder="Type to search cards..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-2 bg-transparent border border-border-default rounded-[var(--radius-default)] focus:border-button-bg outline-none text-center-fg placeholder:text-center-fg/30"
                            />
                            <svg
                                className="absolute right-3 top-2.5 w-5 h-5 text-center-fg/30"
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
                        <label className="block text-sm font-medium text-center-fg mb-2">
                            Select Card ({searchResults.length} found)
                        </label>
                        <div className="border border-border-default rounded-[var(--radius-default)] max-h-64 overflow-y-auto">
                            {searchResults.length === 0 ? (
                                <div className="p-4 text-center text-center-fg/50 text-sm">
                                    No cards found
                                </div>
                            ) : (
                                <div className="divide-y divide-border-default">
                                    {searchResults.map((card) => (
                                        <button
                                            key={card.id}
                                            type="button"
                                            onClick={() => setTargetCardId(card.id)}
                                            className={`w-full p-3 flex items-center gap-3 hover:bg-hover transition-colors ${
                                                targetCardId === card.id ? 'bg-button-bg/10' : ''
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                checked={targetCardId === card.id}
                                                onChange={() => setTargetCardId(card.id)}
                                                className="flex-shrink-0"
                                            />
                                            {card.fields?.icon && (
                                                <span className="text-base flex-shrink-0">
                                                    {card.fields.icon}
                                                </span>
                                            )}
                                            <div className="flex-1 text-left min-w-0">
                                                <div className="font-medium text-sm truncate text-center-fg">
                                                    {card.title || 'Untitled'}
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
                        <div className="p-3 bg-error/10 border border-error/30 rounded-[var(--radius-default)]">
                            <div className="flex items-start gap-2">
                                <svg
                                    className="w-5 h-5 text-error flex-shrink-0 mt-0.5"
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
                                <div className="text-sm text-error">{validationError}</div>
                            </div>
                        </div>
                    )}

                    {/* Options */}
                    {dependencyType === 'blocks' && (
                        <div className="p-4 bg-center-fg/5 rounded-[var(--radius-default)] space-y-3">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={enforceBlocking}
                                    onChange={(e) => setEnforceBlocking(e.target.checked)}
                                    className="mt-1 flex-shrink-0"
                                />
                                <div>
                                    <div className="font-medium text-sm text-center-fg">Enforce blocking</div>
                                    <div className="text-xs text-center-fg/60 mt-0.5">
                                        Prevent the blocked card from being completed until this
                                        card is done
                                    </div>
                                </div>
                            </label>
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-center-fg mb-2">
                            Notes (optional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add any notes about this dependency..."
                            rows={3}
                            className="w-full px-4 py-2 bg-transparent border border-border-default rounded-[var(--radius-default)] focus:border-button-bg outline-none text-center-fg placeholder:text-center-fg/30 resize-none"
                        />
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-border-default mx-6" />

                {/* Footer */}
                <div className="px-6 py-4 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-center-fg bg-center-bg border border-border-default rounded-[var(--radius-default)] hover:bg-hover transition-colors"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!targetCardId || isSubmitting || !!validationError}
                        className="px-4 py-2 bg-button-bg text-button-fg rounded-[var(--radius-default)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isSubmitting ? 'Adding...' : 'Add Dependency'}
                    </button>
                </div>
            </div>
        </div>
    )
}
