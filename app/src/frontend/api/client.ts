import {TOKEN_KEY} from '../lib/constants'

export class ApiError extends Error {
    constructor(public status: number, public data: any) {
        super(`API Error ${status}: ${JSON.stringify(data)}`)
    }
}

function headers(options: RequestInit = {}): HeadersInit {
    const token = localStorage.getItem(TOKEN_KEY)
    let init: RequestInit = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...options.headers,
        },
    }

    if (token) {
        init.headers = {
            ...init.headers,
            Authorization: `Bearer ${token}`,
        }
    }
    return init.headers as HeadersInit
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
    const res = await fetch(`/api/v2${path}`, {
        ...opts,
        headers: {...headers(), ...opts.headers as Record<string, string>}
    })

    if (!res.ok) {
        if (res.status === 401) {
            // Optional: handle unauthorized globally (e.g. redirect to login)
        }
        throw new ApiError(res.status, await res.json().catch(() => ({})))
    }

    // Handle empty responses (like 204 No Content)
    if (res.status === 204) {
        return {} as T;
    }

    return res.json()
}

export const api = {
    get: <T>(path: string) => request<T>(path, {method: 'GET'}),
    post: <T>(path: string, body: any) => request<T>(path, {method: 'POST', body: JSON.stringify(body)}),
    patch: <T>(path: string, body: any) => request<T>(path, {method: 'PATCH', body: JSON.stringify(body)}),
    put: <T>(path: string, body: any) => request<T>(path, {method: 'PUT', body: JSON.stringify(body)}),
    del: <T>(path: string) => request<T>(path, {method: 'DELETE'}),
    setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
    clearToken: () => localStorage.removeItem(TOKEN_KEY),
    getToken: () => localStorage.getItem(TOKEN_KEY)
}
