import React from 'react'
import {createRoute, Outlet, redirect, useParams} from '@tanstack/react-router'
import {Route as rootRoute} from './__root'
import {auth} from '../api/auth'
import {Sidebar} from '../components/sidebar/Sidebar'

export const Route = createRoute({
    getParentRoute: () => rootRoute,
    id: 'auth',
    beforeLoad: async () => {
        try {
            await auth.getMe()
        } catch (error) {
            throw redirect({to: '/login'})
        }
    },
    component: AuthLayout,
})

function AuthLayout() {
    // Try to get boardId from child route params
    const params = useParams({strict: false}) as {boardId?: string}

    return (
        <div className="flex h-full overflow-hidden">
            <Sidebar activeBoardId={params.boardId} />
            <main className="flex-1 flex flex-col overflow-hidden bg-center-bg">
                <Outlet />
            </main>
        </div>
    )
}
