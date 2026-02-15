import {useCallback} from 'react'
import {useTourContext} from '../contexts/TourContext'
import type {TourCategory} from '../lib/tourConstants'

// Re-export the main tour context hook
export {useTourContext}

// Helper hook to check if a specific tour step should be shown
export function useShouldShowStep(category: TourCategory, step: number): boolean {
    const {isTourActive, tourCategory, tourStep} = useTourContext()

    return isTourActive && tourCategory === category && tourStep === step
}

// Helper hook to mark an action as complete and advance the tour
export function useMarkActionComplete(actionType: string) {
    const {advanceTour, isTourActive} = useTourContext()

    return useCallback(() => {
        if (isTourActive) {
            // In the future, we could verify the action type matches the current step
            // For now, simply advance the tour
            advanceTour()
        }
    }, [isTourActive, advanceTour])
}
