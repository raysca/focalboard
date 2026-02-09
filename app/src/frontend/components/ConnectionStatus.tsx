import React from 'react'

interface ConnectionStatusProps {
    isConnected: boolean
}

export function ConnectionStatus({isConnected}: ConnectionStatusProps) {
    // Hide indicator when connected
    if (isConnected) return null

    return (
        <div className="fixed bottom-4 right-4 z-50 bg-yellow-100 border border-yellow-400 rounded-lg px-4 py-2 shadow-lg">
            <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-yellow-600 border-t-transparent rounded-full" />
                <span className="text-sm font-medium text-yellow-800">
                    Reconnecting to real-time updates...
                </span>
            </div>
        </div>
    )
}
