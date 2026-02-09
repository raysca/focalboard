import {createRoute, redirect} from '@tanstack/react-router'
import {Route as rootRoute} from './__root'
import {auth} from '../api/auth'

export const Route = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    beforeLoad: async () => {
        try {
            await auth.getMe()
            // Redirect authenticated users to dashboard
            throw redirect({to: '/dashboard'})
        } catch {
            throw redirect({to: '/login'})
        }
    },
    component: () => <div>Redirecting...</div>,
})
