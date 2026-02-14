import React, { useState } from 'react'
import { createRoute, redirect } from '@tanstack/react-router'
import { Route as authRoute } from './_auth'
import { useAuth } from '../contexts/AuthContext'
import { Tabs } from '../components/admin/Tabs'
import { AuthSettings } from '../components/admin/AuthSettings'
import { PermissionSettings } from '../components/admin/PermissionSettings'
import { FileSettings } from '../components/admin/FileSettings'
import { IntegrationSettings } from '../components/admin/IntegrationSettings'
import { SystemSettings } from '../components/admin/SystemSettings'
import { UserManagement } from '../components/admin/UserManagement'

export const Route = createRoute({
    getParentRoute: () => authRoute,
    path: '/admin/settings',
    beforeLoad: ({ context }) => {
        const user = context.auth?.user
        if (!user?.roles?.includes('admin')) {
            throw redirect({ to: '/dashboard' })
        }
    },
    component: AdminSettingsPage,
})

function AdminSettingsPage() {
    const [activeTab, setActiveTab] = useState('auth')

    const tabs = [
        { id: 'auth', label: 'Authentication', icon: '🔐' },
        { id: 'permissions', label: 'Permissions', icon: '👥' },
        { id: 'files', label: 'Files', icon: '📁' },
        { id: 'integrations', label: 'Integrations', icon: '🔌' },
        { id: 'system', label: 'System', icon: '⚙️' },
        { id: 'users', label: 'Users', icon: '👤' },
    ]

    const renderContent = () => {
        switch (activeTab) {
            case 'auth':
                return <AuthSettings />
            case 'permissions':
                return <PermissionSettings />
            case 'files':
                return <FileSettings />
            case 'integrations':
                return <IntegrationSettings />
            case 'system':
                return <SystemSettings />
            case 'users':
                return <UserManagement />
            default:
                return <AuthSettings />
        }
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-7xl mx-auto py-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Manage application-wide settings and user permissions
                    </p>
                </div>

                <div className="flex gap-6">
                    <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
                    <div className="flex-1 p-6">{renderContent()}</div>
                </div>
            </div>
        </div>
    )
}
