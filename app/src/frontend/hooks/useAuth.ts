import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {auth} from '../api/auth'
import {api} from '../api/client'
import {useNavigate} from '@tanstack/react-router'

export function useLoginMutation() {
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    return useMutation({
        mutationFn: auth.login,
        onSuccess: (data) => {
            api.setToken(data.token)
            queryClient.setQueryData(['me'], data.user)
            navigate({to: '/'})
        },
    })
}

export function useRegisterMutation() {
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    return useMutation({
        mutationFn: auth.register,
        onSuccess: (data) => {
            api.setToken(data.token)
            queryClient.setQueryData(['me'], data.user)
            navigate({to: '/'})
        },
    })
}

export function useLogoutMutation() {
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    return useMutation({
        mutationFn: auth.logout,
        onSettled: () => {
            api.clearToken()
            queryClient.setQueryData(['me'], null)
            navigate({to: '/login'})
        },
    })
}

export function useMeQuery() {
    return useQuery({
        queryKey: ['me'],
        queryFn: auth.getMe,
        retry: false,
        enabled: !!api.getToken(),
    })
}
