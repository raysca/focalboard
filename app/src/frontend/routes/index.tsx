import {createRoute, redirect} from '@tanstack/react-router'
import {Route as rootRoute} from './__root'
import {auth} from '../api/auth'
import {preferencesApi} from '../api/preferences'

export const Route = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    beforeLoad: async () => {
        try {
            await auth.getMe()

            // Check if user needs onboarding
            try {
                const preferences = await preferencesApi.getPreferences()
                const tourStep = preferences?.onboarding?.tourStep

                // Redirect to welcome if tour not started or just started
                if (!tourStep || tourStep === '0') {
                    throw redirect({to: '/welcome'})
                } else {
                    throw redirect({to: '/dashboard'})
                }
            } catch {
                // If preferences fetch fails, default to dashboard
                throw redirect({to: '/dashboard'})
            }
        } catch (error) {
            // Not authenticated, redirect to login
            throw redirect({to: '/login'})
        }
    },
    component: () => <div>Redirecting...</div>,
})
