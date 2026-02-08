import React, {useState, useEffect} from 'react'
import {createRoute, Link} from '@tanstack/react-router'
import {Route as authRoute} from './_auth'
import {Button} from '../components/ui/Button'
import {Input} from '../components/ui/Input'
import {useAuth} from '../contexts/AuthContext'
import {useMutation, useQueryClient} from '@tanstack/react-query'
import {auth} from '../api/auth'
import type {User} from '../api/types'

export const Route = createRoute({
    getParentRoute: () => authRoute,
    path: '/settings',
    component: SettingsPage,
})

function SettingsPage() {
    const {user} = useAuth()
    const queryClient = useQueryClient()
    const [formData, setFormData] = useState<Partial<User>>({})
    const [successMessage, setSuccessMessage] = useState('')

    useEffect(() => {
        if (user) {
            setFormData({
                nickname: user.nickname || '',
                firstname: user.firstname || '',
                lastname: user.lastname || '',
                email: user.email || '',
                username: user.username || ''
            })
        }
    }, [user])

    const updateMutation = useMutation({
        mutationFn: (data: Partial<User>) => {
            if (!user?.id) throw new Error("Not logged in")
            return auth.updateMe(user.id, data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['me']})
            setSuccessMessage('Profile updated successfully.')
            setTimeout(() => setSuccessMessage(''), 3000)
        }
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target
        setFormData(prev => ({...prev, [name]: value}))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        // Filter out read-only fields if needed, but for now sending all editable ones
        const {nickname, firstname, lastname} = formData

        // We might not want to send email/username if they are not editable or handled differently
        // But the plan said "Username (readonly?), Email...".
        // Let's verify what the backend accepts.
        // For now, I'll send nickname, firstname, lastname.

        updateMutation.mutate({
            nickname,
            firstname,
            lastname
        })
    }

    // Check if context has setUser or refetch
    // I will read AuthContext separately.

    return (
        <div className="flex-1 flex flex-col h-full bg-center-bg overflow-y-auto">
            <div className="w-full max-w-2xl mx-auto py-8 px-6">
                <h1 className="text-2xl font-semibold mb-6 text-center-fg">Account Settings</h1>

                <div className="bg-center-bg border border-border-default rounded-lg p-6 shadow-sm">
                    <h2 className="text-lg font-medium mb-4 text-center-fg">Profile</h2>

                    {successMessage && (
                        <div className="mb-4 p-3 bg-green-500/10 text-green-500 rounded border border-green-500/20 text-sm">
                            {successMessage}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-center-fg/70 mb-1">
                                    Username
                                </label>
                                <Input
                                    value={formData.username || ''}
                                    disabled
                                    className="bg-center-bg/50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-center-fg/70 mb-1">
                                    Email
                                </label>
                                <Input
                                    value={formData.email || ''}
                                    disabled
                                    className="bg-center-bg/50"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-center-fg/70 mb-1">
                                Nickname
                            </label>
                            <Input
                                name="nickname"
                                value={formData.nickname || ''}
                                onChange={handleChange}
                                placeholder="Display name"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-center-fg/70 mb-1">
                                    First Name
                                </label>
                                <Input
                                    name="firstname"
                                    value={formData.firstname || ''}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-center-fg/70 mb-1">
                                    Last Name
                                </label>
                                <Input
                                    name="lastname"
                                    value={formData.lastname || ''}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex items-center justify-between">
                            <Link
                                to="/change-password"
                                className="text-sm text-link hover:underline"
                            >
                                Change Password
                            </Link>

                            <Button
                                type="submit"
                                filled
                                disabled={updateMutation.isPending}
                            >
                                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                        {updateMutation.isError && (
                            <div className="text-red-500 text-sm mt-2">
                                Failed to update profile.
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    )
}
