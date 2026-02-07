import React from 'react'
import {createRoute} from '@tanstack/react-router'
import {Route as authRoute} from './_auth'
import {Layout} from 'lucide-react'

export const Route = createRoute({
    getParentRoute: () => authRoute,
    path: '/dashboard',
    component: DashboardComponent,
})

function DashboardComponent() {
    return (
        <div className="flex-1 flex items-center justify-center text-center-fg/40">
            <div className="text-center">
                <Layout size={48} className="mx-auto mb-4 opacity-30" />
                <h2 className="text-lg font-medium mb-1">Welcome to Focalboard</h2>
                <p className="text-sm">Select a board from the sidebar or create a new one to get started.</p>
            </div>
        </div>
    )
}
