import React, {useState} from 'react'
import {createRoute, Link} from '@tanstack/react-router'
import {Route as rootRoute} from './__root'
import {Button} from '../components/ui/Button'
import {Input} from '../components/ui/Input'
import {useLoginMutation} from '../hooks/useAuth'

export const Route = createRoute({
    getParentRoute: () => rootRoute,
    path: '/login',
    component: LoginComponent,
})

function LoginComponent() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const loginMutation = useLoginMutation()

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        loginMutation.mutate({username, password})
    }

    return (
        <div className="flex items-start justify-center min-h-screen bg-center-bg font-sans">
            <div className="w-[450px] h-[400px] mt-[150px] flex flex-col items-center border border-[#ccc] rounded-[15px] shadow-[rgba(63,67,80,0.1)_0_0_0_1px,rgba(63,67,80,0.3)_0_4px_8px] bg-center-bg transition-colors duration-200">

                <form onSubmit={handleSubmit} className="flex flex-col items-start justify-center mt-[50px] w-[250px] gap-[10px]">
                    <h1 className="text-[16px] font-medium mb-2 text-center-fg self-start">Log in</h1>

                    <Input
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={loginMutation.isPending}
                        autoFocus
                        className="h-[44px] border-[#ccc]"
                    />
                    <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loginMutation.isPending}
                        className="h-[44px] border-[#ccc]"
                    />

                    {loginMutation.isError && (
                        <div className="text-[#900000] text-xs">
                            Login failed
                        </div>
                    )}

                    <Button
                        type="submit"
                        filled
                        className="mt-[10px] mb-[20px] w-full min-h-[38px] text-[14px]"
                        disabled={loginMutation.isPending}
                    >
                        {loginMutation.isPending ? 'Logging in...' : 'Log in'}
                    </Button>
                </form>

                <div className="text-sm">
                    <Link to="/register" className="text-link hover:underline">
                        or create an account if you don't have one
                    </Link>
                </div>
            </div>
        </div>
    )
}
