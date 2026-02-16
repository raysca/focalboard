import React from 'react'
import {createRoute, useNavigate} from '@tanstack/react-router'
import {Route as authRoute} from './_auth'
import {Rocket, SkipForward} from 'lucide-react'
import {useMutation, useQueryClient} from '@tanstack/react-query'
import {preferencesApi} from '../api/preferences'
import {useMeQuery} from '../hooks/useAuth'
import {DEFAULT_TEAM_ID} from '../lib/constants'
import {api} from '../api/client'

export const Route = createRoute({
    getParentRoute: () => authRoute,
    path: '/welcome',
    component: WelcomeComponent,
})

function WelcomeComponent() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const {data: user} = useMeQuery()

    const createOnboardingBoardMutation = useMutation({
        mutationFn: async () => {
            const response = await api.post<{teamID: string; boardID: string}>(
                `/teams/${DEFAULT_TEAM_ID}/onboard`,
            )
            return response
        },
        onSuccess: async (data) => {
            // Set onboarding preferences
            if (user) {
                await preferencesApi.updatePreference(user.id, {
                    category: 'onboardingTourStarted',
                    name: 'onboardingTourStarted',
                    value: '1',
                })
                await preferencesApi.updatePreference(user.id, {
                    category: 'tourCategory',
                    name: 'tourCategory',
                    value: 'onboarding',
                })
                await preferencesApi.updatePreference(user.id, {
                    category: 'onboardingTourStep',
                    name: 'onboardingTourStep',
                    value: '0',
                })
                queryClient.invalidateQueries({queryKey: ['preferences']})
            }
            // Navigate to the created board
            navigate({to: '/board/$boardId', params: {boardId: data.boardID}})
        },
    })

    const skipTourMutation = useMutation({
        mutationFn: async () => {
            if (user) {
                await preferencesApi.updatePreference(user.id, {
                    category: 'onboardingTourStep',
                    name: 'onboardingTourStep',
                    value: '999',
                })
                queryClient.invalidateQueries({queryKey: ['preferences']})
            }
        },
        onSuccess: () => {
            navigate({to: '/dashboard'})
        },
    })

    return (
        <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-purple-50">
            <div className="max-w-2xl w-full text-center">
                {/* Icon */}
                <div className="mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                        <Rocket className="w-10 h-10 text-white" />
                    </div>
                </div>

                {/* Heading */}
                <h1 className="text-4xl font-bold text-center-fg mb-4">
                    Welcome to Focalboard
                </h1>

                {/* Description */}
                <p className="text-lg text-center-fg/70 mb-8 max-w-xl mx-auto">
                    Organize your work with boards, cards, and views. Whether you're managing projects,
                    tracking tasks, or planning sprints, Focalboard helps you stay focused and productive.
                </p>

                {/* Feature Highlights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-3xl mx-auto">
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-black/5">
                        <div className="text-3xl mb-3">📋</div>
                        <h3 className="font-semibold text-center-fg mb-2">Flexible Boards</h3>
                        <p className="text-sm text-center-fg/60">
                            Create boards for any workflow - kanban, table, gallery, or calendar view
                        </p>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-black/5">
                        <div className="text-3xl mb-3">🎯</div>
                        <h3 className="font-semibold text-center-fg mb-2">Rich Cards</h3>
                        <p className="text-sm text-center-fg/60">
                            Add properties, comments, attachments, and more to track every detail
                        </p>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-black/5">
                        <div className="text-3xl mb-3">👥</div>
                        <h3 className="font-semibold text-center-fg mb-2">Collaborate</h3>
                        <p className="text-sm text-center-fg/60">
                            Share boards with your team and work together in real-time
                        </p>
                    </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        onClick={() => createOnboardingBoardMutation.mutate()}
                        disabled={createOnboardingBoardMutation.isPending}
                        className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {createOnboardingBoardMutation.isPending ? 'Creating...' : 'Take a tour'}
                    </button>
                    <button
                        onClick={() => skipTourMutation.mutate()}
                        disabled={skipTourMutation.isPending}
                        className="px-8 py-3 bg-white text-center-fg rounded-lg hover:bg-black/5 transition-all duration-200 font-medium border border-black/10 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <SkipForward className="w-4 h-4" />
                        {skipTourMutation.isPending ? 'Skipping...' : "No thanks, I'll figure it out myself"}
                    </button>
                </div>

                {/* Footer note */}
                <p className="text-sm text-center-fg/50 mt-8">
                    You can always access help and tutorials from the menu
                </p>
            </div>
        </div>
    )
}
