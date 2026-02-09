import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {auth} from '../api/auth'
import {useNavigate} from '@tanstack/react-router'

export function useLoginMutation() {
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    return useMutation({
        mutationFn: auth.login,
        onSuccess: (data) => {
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
