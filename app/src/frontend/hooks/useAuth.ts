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

            // Check if user has viewed welcome page
            try {
                const preferences = await preferencesApi.getPreferences()
                const welcomeViewed = preferences?.onboarding?.welcomePageViewed === '1'

                // Redirect to welcome if not viewed, otherwise to dashboard
                window.location.href = welcomeViewed ? '/dashboard' : '/welcome'
            } catch {
                // If preferences fail to load, default to welcome page for new users
                window.location.href = '/welcome'
            }
        },
    })
}

export function useRegisterMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: auth.register,
        onSuccess: (data) => {
            queryClient.setQueryData(['me'], data.user)
            // Use hard redirect to ensure navigation works
            window.location.href = '/dashboard'
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
