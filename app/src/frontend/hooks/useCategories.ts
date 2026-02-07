import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import {categoriesApi} from '../api/categories'
import type {Category} from '../api/types'

export function useCategoriesQuery(teamId: string) {
    return useQuery({
        queryKey: ['categories', teamId],
        queryFn: () => categoriesApi.getCategories(teamId),
        enabled: !!teamId,
    })
}

export function useCreateCategoryMutation(teamId: string) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (category: Partial<Category>) => categoriesApi.createCategory(teamId, category),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['categories', teamId]})
        },
    })
}

export function useUpdateCategoryMutation(teamId: string) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({categoryId, category}: {categoryId: string; category: Partial<Category>}) =>
            categoriesApi.updateCategory(teamId, categoryId, category),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['categories', teamId]})
        },
    })
}

export function useDeleteCategoryMutation(teamId: string) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (categoryId: string) => categoriesApi.deleteCategory(teamId, categoryId),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['categories', teamId]})
        },
    })
}
