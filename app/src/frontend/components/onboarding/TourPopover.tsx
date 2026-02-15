import React, {useEffect, useRef} from 'react'
import {
    useFloating,
    autoUpdate,
    offset,
    flip,
    shift,
    arrow,
    type Placement,
} from '@floating-ui/react'
import {TourBackdrop} from './TourBackdrop'

interface TourPopoverProps {
    targetElement: HTMLElement | null
    title: string
    content: string
    placement?: Placement
    showBackdrop?: boolean
    onNext: () => void
    onSkip: () => void
}

export function TourPopover({
    targetElement,
    title,
    content,
    placement = 'bottom',
    showBackdrop = true,
    onNext,
    onSkip,
}: TourPopoverProps) {
    const arrowRef = useRef<HTMLDivElement>(null)

    const {refs, floatingStyles, middlewareData} = useFloating({
        elements: {
            reference: targetElement,
        },
        placement,
        middleware: [
            offset(12),
            flip(),
            shift({padding: 8}),
            arrow({element: arrowRef}),
        ],
        whileElementsMounted: autoUpdate,
    })

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onSkip()
            } else if (e.key === 'Enter') {
                onNext()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [onNext, onSkip])

    if (!targetElement) return null

    // Calculate arrow position
    const arrowX = middlewareData.arrow?.x
    const arrowY = middlewareData.arrow?.y
    const arrowSide = placement.split('-')[0] as 'top' | 'right' | 'bottom' | 'left'

    const arrowStyles: React.CSSProperties = {
        left: arrowX != null ? `${arrowX}px` : '',
        top: arrowY != null ? `${arrowY}px` : '',
        [arrowSide]: '-4px',
    }

    return (
        <>
            {showBackdrop && <TourBackdrop targetElement={targetElement} show={true} />}

            <div
                ref={refs.setFloating}
                style={floatingStyles}
                className="z-50 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4"
                role="dialog"
                aria-labelledby="tour-title"
                aria-describedby="tour-content"
            >
                {/* Arrow */}
                <div
                    ref={arrowRef}
                    style={arrowStyles}
                    className="absolute w-2 h-2 bg-white border-gray-200 rotate-45"
                    aria-hidden="true"
                />

                {/* Content */}
                <div className="relative z-10 bg-white">
                    <h3 id="tour-title" className="text-lg font-semibold text-gray-900 mb-2">
                        {title}
                    </h3>

                    <p id="tour-content" className="text-sm text-gray-600 mb-4">
                        {content}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-2">
                        <button
                            onClick={onSkip}
                            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            Skip tour
                        </button>

                        <button
                            onClick={onNext}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
