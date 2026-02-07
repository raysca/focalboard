import React from 'react'
import {RouterProvider} from '@tanstack/react-router'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {router} from './router'
import {AuthProvider, useAuth} from './contexts/AuthContext'
import {UIProvider} from './contexts/UIContext'
import {ToastProvider} from './components/ui/Toast'
import {ErrorBoundary} from './components/ui/ErrorBoundary'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60, // 1 min
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
})

function AppContent() {
    const auth = useAuth()
    return <RouterProvider router={router} context={{auth}} />
}

export default function App() {
    return (
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <UIProvider>
                    <ToastProvider>
                        <AuthProvider>
                            <AppContent />
                        </AuthProvider>
                    </ToastProvider>
                </UIProvider>
            </QueryClientProvider>
        </ErrorBoundary>
    )
}
