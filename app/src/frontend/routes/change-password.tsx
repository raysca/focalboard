import React, {useState} from 'react'
import {createRoute, Link} from '@tanstack/react-router'
import {Route as rootRoute} from './__root'
import {Button} from '../components/ui/Button'
import {Input} from '../components/ui/Input'
import {api} from '../api/client'
import {useMutation} from '@tanstack/react-query'
import {auth} from '../api/auth'
import {useAuth} from '../contexts/AuthContext'

export const Route = createRoute({
    getParentRoute: () => rootRoute,
    path: '/change-password',
    component: ChangePasswordComponent,
})

function ChangePasswordComponent() {
    const [oldPassword, setOldPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [success, setSuccess] = useState(false)
    const {user} = useAuth()

    const mutation = useMutation({
        mutationFn: (data: {oldPassword?: string; newPassword?: string}) => {
            if (!user?.id) throw new Error("not logged in")
            return auth.changePassword(user.id, data)
        },
        onSuccess: () => {
            setSuccess(true)
            setOldPassword('')
            setNewPassword('')
        }
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        mutation.mutate({oldPassword, newPassword})
    }

    return (
        <div className="flex items-start justify-center min-h-screen bg-center-bg font-sans">
            <div className="w-[450px] h-[400px] mt-[150px] flex flex-col items-center border border-[#ccc] rounded-[15px] shadow-[rgba(63,67,80,0.1)_0_0_0_1px,rgba(63,67,80,0.3)_0_4px_8px] bg-center-bg transition-colors duration-200">

                {success ? (
                    <div className="flex flex-col items-center gap-4 mt-[100px]">
                        <div className="text-green-600">Password changed successfully.</div>
                        <Link to="/" className="text-link hover:underline">Return to Dashboard</Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col items-start justify-center mt-[50px] w-[250px] gap-[10px]">
                        <h1 className="text-[16px] font-medium mb-2 text-center-fg self-start">Change Password</h1>
                        <Input
                            type="password"
                            placeholder="Current Password"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            disabled={mutation.isPending}
                            autoFocus
                            className="h-[44px] border-[#ccc]"
                        />
                        <Input
                            type="password"
                            placeholder="New Password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={mutation.isPending}
                            className="h-[44px] border-[#ccc]"
                        />

                        {mutation.isError && (
                            <div className="text-[#900000] text-xs">
                                Failed to change password.
                            </div>
                        )}

                        <Button
                            type="submit"
                            filled
                            className="mt-[10px] mb-[20px] w-full min-h-[38px] text-[14px]"
                            disabled={mutation.isPending}
                        >
                            {mutation.isPending ? 'Saving...' : 'Save'}
                        </Button>
                    </form>
                )}
            </div>
        </div>
    )
}
