export class ApiError extends Error {
    constructor(public status: number, public data: any) {
        super(`API Error ${status}: ${JSON.stringify(data)}`)
    }
}

function headers(options: RequestInit = {}): HeadersInit {
    return {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...options.headers,
    } as HeadersInit
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
    const res = await fetch(`/api/v2${path}`, {
        ...opts,
        credentials: 'include',
        headers: {...headers(), ...opts.headers as Record<string, string>}
    })

    if (!res.ok) {
        if (res.status === 401) {
            // Session expired, redirect to login only if not already there
            if (!window.location.pathname.startsWith('/login')) {
                window.location.href = '/login'
            }
            throw new ApiError(res.status, {message: 'Session expired. Please log in again.'})
        }
        throw new ApiError(res.status, await res.json().catch(() => ({})))
    }

    // Handle empty responses (like 204 No Content)
    if (res.status === 204) {
        return {} as T
    }

    return res.json()
}

export const api = {
    get: <T>(path: string) => request<T>(path, {method: 'GET'}),
    post: <T>(path: string, body: any) => request<T>(path, {method: 'POST', body: JSON.stringify(body)}),
    patch: <T>(path: string, body: any) => request<T>(path, {method: 'PATCH', body: JSON.stringify(body)}),
    put: <T>(path: string, body: any) => request<T>(path, {method: 'PUT', body: JSON.stringify(body)}),
    del: <T>(path: string) => request<T>(path, {method: 'DELETE'}),
}
