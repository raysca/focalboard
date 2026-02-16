import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {auth} from '../api/auth'
import {useNavigate} from '@tanstack/react-router'
import {preferencesApi} from '../api/preferences'

export function useLoginMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: auth.login,
        onSuccess: async (data) => {
            queryClient.setQueryData(['me'], data.user)

            // Check if user needs onboarding
            try {
                const preferences = await preferencesApi.getPreferences()
                const tourStep = preferences?.onboarding?.tourStep

                // Redirect to welcome if tour not started or just started
                if (!tourStep || tourStep === '0') {
                    window.location.href = '/welcome'
                } else {
                    window.location.href = '/dashboard'
                }
            } catch {
                // If preferences fetch fails, default to dashboard
                window.location.href = '/dashboard'
            }
        },
    })
}

export function useRegisterMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: auth.register,
        onSuccess: async (data) => {
            queryClient.setQueryData(['me'], data.user)

            // Check if user needs onboarding
            try {
                const preferences = await preferencesApi.getPreferences()
                const tourStep = preferences?.onboarding?.tourStep

                // Redirect to welcome if tour not started or just started
                if (!tourStep || tourStep === '0') {
                    window.location.href = '/welcome'
                } else {
                    window.location.href = '/dashboard'
                }
            } catch {
                // If preferences fetch fails, default to welcome for new users
                window.location.href = '/welcome'
            }
        },
    })
}

export function useLogoutMutation() {
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    return useMutation({
        mutationFn: auth.logout,
        onSettled: () => {
            queryClient.setQueryData(['me'], null)
            queryClient.clear()
            navigate({to: '/login'})
        },
    })
}

export function useMeQuery() {
    return useQuery({
        queryKey: ['me'],
        queryFn: auth.getMe,
        retry: false,
    })
}
