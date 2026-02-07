import React, {useState} from 'react'
import {createRoute, Link} from '@tanstack/react-router'
import {Route as rootRoute} from './__root'
import {Button} from '../components/ui/Button'
import {Input} from '../components/ui/Input'
import {useRegisterMutation} from '../hooks/useAuth'

export const Route = createRoute({
    getParentRoute: () => rootRoute,
    path: '/register',
    component: RegisterComponent,
})

function RegisterComponent() {
    const [email, setEmail] = useState('')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const registerMutation = useRegisterMutation()

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        registerMutation.mutate({email, username, password})
    }

    return (
        <div className="flex items-start justify-center min-h-screen bg-center-bg font-sans">
            <div className="w-[450px] h-[600px] mt-[150px] flex flex-col items-center border border-[#ccc] rounded-[15px] shadow-[rgba(63,67,80,0.1)_0_0_0_1px,rgba(63,67,80,0.3)_0_4px_8px] bg-center-bg transition-colors duration-200">

                <form onSubmit={handleSubmit} className="flex flex-col items-start justify-center mt-[50px] w-[250px] gap-[10px]">
                    <h1 className="text-[16px] font-medium mb-2 text-center-fg self-start">Sign up</h1>
                    <Input
                        placeholder="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={registerMutation.isPending}
                        autoFocus
                        className="h-[44px] border-[#ccc]"
                    />
                    <Input
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={registerMutation.isPending}
                        className="h-[44px] border-[#ccc]"
                    />
                    <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={registerMutation.isPending}
                        className="h-[44px] border-[#ccc]"
                    />

                    {registerMutation.isError && (
                        <div className="text-[#900000] text-xs">
                            Registration failed. Please try again.
                        </div>
                    )}

                    <Button
                        type="submit"
                        filled
                        className="mt-[10px] mb-[20px] w-full min-h-[38px] text-[14px]"
                        disabled={registerMutation.isPending}
                    >
                        {registerMutation.isPending ? 'Signing up...' : 'Sign up'}
                    </Button>
                </form>

                <div className="text-sm">
                    <Link to="/login" className="text-link hover:underline">
                        or log in if you have an account
                    </Link>
                </div>
            </div>
        </div>
    )
}
