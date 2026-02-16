import React from 'react'
import {createRoute, redirect, useNavigate} from '@tanstack/react-router'
import {Route as rootRoute} from './__root'
import {auth} from '../api/auth'
import {Button} from '../components/ui/Button'
import {useOnboardMutation} from '../hooks/useTeams'
import {useUpdatePreferenceMutation} from '../api/preferences'
import {useMeQuery} from '../hooks/useAuth'
import {DEFAULT_TEAM_ID} from '../lib/constants'

export const Route = createRoute({
    getParentRoute: () => rootRoute,
    path: '/welcome',
    beforeLoad: async () => {
        try {
            await auth.getMe()
        } catch (error) {
            throw redirect({to: '/login'})
        }
    },
    component: WelcomeComponent,
})

function WelcomeComponent() {
    const navigate = useNavigate()
    const {data: user} = useMeQuery()
    const onboardMutation = useOnboardMutation()
    const updatePreferenceMutation = useUpdatePreferenceMutation()

    const handleTakeTour = async () => {
        if (!user?.id) return

        try {
            // Create onboarding board and set tour preferences
            const result = await onboardMutation.mutateAsync(DEFAULT_TEAM_ID)

            // Navigate to the new board
            navigate({to: '/board/$boardId', params: {boardId: result.boardID}})
        } catch (error) {
            console.error('Failed to start onboarding:', error)
        }
    }

    const handleSkipTour = async () => {
        if (!user?.id) return

        try {
            // Set tourStep to 999 to mark tour as completed/skipped
            await updatePreferenceMutation.mutateAsync({
                userId: user.id,
                category: 'onboarding',
                name: 'tourStep',
                value: '999',
            })

            // Navigate to dashboard
            navigate({to: '/dashboard'})
        } catch (error) {
            console.error('Failed to skip tour:', error)
        }
    }

    return (
        <div className="flex-1 flex items-center justify-center bg-center-bg p-8">
            <div className="max-w-2xl w-full text-center">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-center-fg mb-4">
                        Welcome to Focalboard! 👋
                    </h1>
                    <p className="text-xl text-center-fg/70 mb-2">
                        Your open-source project management tool
                    </p>
                    <p className="text-center-fg/60 max-w-lg mx-auto">
                        Organize your work with boards, cards, and views. Collaborate with your team and stay on top of your projects.
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-8 mb-8">
                    <h2 className="text-2xl font-semibold text-center-fg mb-6">
                        Let's get you started
                    </h2>
                    <p className="text-center-fg/70 mb-8">
                        Would you like a quick tour to learn the basics? We'll create a sample board and guide you through the key features.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            filled
                            size="large"
                            onClick={handleTakeTour}
                            disabled={onboardMutation.isPending}
                            className="min-w-[200px]"
                        >
                            {onboardMutation.isPending ? 'Creating board...' : 'Take a tour'}
                        </Button>
                        <Button
                            emphasis="secondary"
                            size="large"
                            onClick={handleSkipTour}
                            disabled={updatePreferenceMutation.isPending}
                            className="min-w-[200px]"
                        >
                            No thanks, I'll figure it out myself
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="text-3xl mb-3">📋</div>
                        <h3 className="font-semibold text-center-fg mb-2">Boards & Cards</h3>
                        <p className="text-sm text-center-fg/60">
                            Create boards to organize your projects and cards to track individual tasks
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="text-3xl mb-3">👁️</div>
                        <h3 className="font-semibold text-center-fg mb-2">Multiple Views</h3>
                        <p className="text-sm text-center-fg/60">
                            Switch between Kanban, Table, Gallery, and Calendar views to visualize your work
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="text-3xl mb-3">🤝</div>
                        <h3 className="font-semibold text-center-fg mb-2">Collaborate</h3>
                        <p className="text-sm text-center-fg/60">
                            Share boards with your team and work together in real-time
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
