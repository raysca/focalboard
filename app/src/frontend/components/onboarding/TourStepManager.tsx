import React, {useEffect, useState} from 'react'
import {useTourContext} from '../../contexts/TourContext'
import {TourPopover} from './TourPopover'
import {TOUR_STEPS} from './tourSteps'

export function TourStepManager() {
    const {isTourActive, tourCategory, tourStep, advanceTour, skipTour} = useTourContext()
    const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)

    // Get current step data
    const currentStepData = tourCategory && TOUR_STEPS[tourCategory]?.[tourStep]

    // Find target element when step changes
    useEffect(() => {
        if (!isTourActive || !currentStepData) {
            setTargetElement(null)
            return
        }

        // Wait for DOM to be ready, then find target element
        const findTarget = () => {
            const element = document.querySelector<HTMLElement>(currentStepData.targetSelector)
            setTargetElement(element)

            if (!element) {
                // Retry after a short delay if element not found
                setTimeout(findTarget, 100)
            }
        }

        // Initial attempt
        findTarget()

        // Set up MutationObserver to watch for DOM changes
        const observer = new MutationObserver(() => {
            const element = document.querySelector<HTMLElement>(currentStepData.targetSelector)
            if (element && element !== targetElement) {
                setTargetElement(element)
            }
        })

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        })

        return () => observer.disconnect()
    }, [isTourActive, currentStepData, tourCategory, tourStep])

    if (!isTourActive || !currentStepData || !targetElement) {
        return null
    }

    return (
        <TourPopover
            targetElement={targetElement}
            title={currentStepData.title}
            content={currentStepData.content}
            placement="bottom"
            showBackdrop={true}
            onNext={advanceTour}
            onSkip={skipTour}
        />
    )
}
