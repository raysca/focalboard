import {createRoute, redirect} from '@tanstack/react-router'
import {Route as rootRoute} from './__root'
import {api} from '../api/client'

export const Route = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    beforeLoad: async () => {
        const token = api.getToken()
        if (!token) {
            throw redirect({to: '/login'})
        }
        // Redirect authenticated users to dashboard
        throw redirect({to: '/dashboard'})
    },
    component: () => <div>Redirecting...</div>,
})
