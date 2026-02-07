import {api} from './client'
import type {Category} from './types'

export const categoriesApi = {
    getCategories: (teamId: string) =>
        api.get<Category[]>(`/teams/${teamId}/categories`),

    createCategory: (teamId: string, category: Partial<Category>) =>
        api.post<Category>(`/teams/${teamId}/categories`, category),

    updateCategory: (teamId: string, categoryId: string, category: Partial<Category>) =>
        api.put<Category>(`/teams/${teamId}/categories/${categoryId}`, category),

    deleteCategory: (teamId: string, categoryId: string) =>
        api.del<void>(`/teams/${teamId}/categories/${categoryId}`),

    reorderCategories: (teamId: string, categoryIds: string[]) =>
        api.put<void>(`/teams/${teamId}/categories/reorder`, categoryIds),

    updateCategoryBoard: (teamId: string, categoryId: string, boardId: string, hidden: boolean) =>
        api.post<void>(`/teams/${teamId}/categories/${categoryId}/boards/${boardId}`, {hide: hidden}),
}
