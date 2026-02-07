import {api} from './client'
import type {Card} from './types'

export const cardsApi = {
    getCards: (boardId: string, params?: {page?: number; per_page?: number}) => {
        const qs = new URLSearchParams()
        if (params?.page !== undefined) qs.set('page', String(params.page))
        if (params?.per_page !== undefined) qs.set('per_page', String(params.per_page))
        const query = qs.toString()
        return api.get<Card[]>(`/boards/${boardId}/cards${query ? '?' + query : ''}`)
    },

    getCard: (cardId: string) =>
        api.get<Card>(`/cards/${cardId}`),

    createCard: (boardId: string, card: Partial<Card>) =>
        api.post<Card>(`/boards/${boardId}/cards`, card),

    patchCard: (cardId: string, patch: Partial<Card>) =>
        api.patch<Card>(`/cards/${cardId}`, patch),
}
