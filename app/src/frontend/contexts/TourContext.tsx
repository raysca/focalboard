import React, {createContext, useContext, useState, useEffect, useCallback} from 'react'
import {usePreferencesQuery, useUpdatePreferenceMutation} from '../api/preferences'
import {useAuth} from './AuthContext'
import {TOUR_ORDER, TOUR_FINISHED, type TourCategory} from '../lib/tourConstants'

interface TourContextType {
    isTourActive: boolean
    tourCategory: TourCategory | null
    tourStep: number
    isOnboardingBoard: boolean
    advanceTour: () => void
    skipTour: () => void
    setOnboardingBoard: (isOnboarding: boolean) => void
}

const TourContext = createContext<TourContextType | undefined>(undefined)

export function TourProvider({children}: {children: React.ReactNode}) {
    const {user} = useAuth()
    const {data: preferences} = usePreferencesQuery()
    const updatePreference = useUpdatePreferenceMutation()

    const [isOnboardingBoard, setIsOnboardingBoard] = useState(false)

    // Derive tour state from preferences
    const tourStarted = preferences?.onboarding?.tourStarted === '1'
    const tourCategory = (preferences?.onboarding?.tourCategory as TourCategory) || null
    const tourStep = parseInt(preferences?.onboarding?.tourStep || '0', 10)

    const isTourActive = tourStarted && tourStep !== TOUR_FINISHED && isOnboardingBoard

    const advanceTour = useCallback(() => {
        if (!user || !tourCategory) return

        const currentCategoryConfig = TOUR_ORDER[tourCategory]
        const nextStep = tourStep + 1

        // Check if we need to advance to next category
        if (nextStep >= currentCategoryConfig.steps) {
            const nextCategory = currentCategoryConfig.next

            if (nextCategory) {
                // Move to next category, step 0
                updatePreference.mutate({
                    userId: user.id,
                    category: 'onboarding',
                    name: 'tourCategory',
                    value: nextCategory,
                })
                updatePreference.mutate({
                    userId: user.id,
                    category: 'onboarding',
                    name: 'tourStep',
                    value: '0',
                })
            } else {
                // Tour complete
                updatePreference.mutate({
                    userId: user.id,
                    category: 'onboarding',
                    name: 'tourStep',
                    value: String(TOUR_FINISHED),
                })
            }
        } else {
            // Advance to next step in current category
            updatePreference.mutate({
                userId: user.id,
                category: 'onboarding',
                name: 'tourStep',
                value: String(nextStep),
            })
        }
    }, [user, tourCategory, tourStep, updatePreference])

    const skipTour = useCallback(() => {
        if (!user) return

        updatePreference.mutate({
            userId: user.id,
            category: 'onboarding',
            name: 'tourStep',
            value: String(TOUR_FINISHED),
        })
    }, [user, updatePreference])

    return (
        <TourContext.Provider
            value={{
                isTourActive,
                tourCategory,
                tourStep,
                isOnboardingBoard,
                advanceTour,
                skipTour,
                setOnboardingBoard: setIsOnboardingBoard,
            }}
        >
            {children}
        </TourContext.Provider>
    )
}

export const useTourContext = () => {
    const context = useContext(TourContext)
    if (!context) throw new Error('useTourContext must be used within a TourProvider')
    return context
}
