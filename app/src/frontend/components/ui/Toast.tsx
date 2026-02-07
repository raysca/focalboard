import React, {createContext, useContext, useState, useCallback, useEffect} from 'react'
import {X, CheckCircle, AlertCircle, AlertTriangle, Info} from 'lucide-react'
import {cn} from '../../lib/cn'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
    id: string
    message: string
    type: ToastType
    duration?: number
}

interface ToastContextType {
    addToast: (message: string, type?: ToastType, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({children}: {children: React.ReactNode}) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const addToast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
        const id = crypto.randomUUID()
        setToasts((prev) => [...prev, {id, message, type, duration}])
    }, [])

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }, [])

    return (
        <ToastContext.Provider value={{addToast}}>
            {children}
            {/* Toast container */}
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) throw new Error('useToast must be used within a ToastProvider')
    return context
}

const toastIcons: Record<ToastType, React.ElementType> = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
}

const toastColors: Record<ToastType, string> = {
    success: 'border-l-success text-success',
    error: 'border-l-error text-error',
    warning: 'border-l-warning text-warning',
    info: 'border-l-button-bg text-button-bg',
}

function ToastItem({toast, onDismiss}: {toast: Toast; onDismiss: () => void}) {
    const Icon = toastIcons[toast.type]

    useEffect(() => {
        if (toast.duration && toast.duration > 0) {
            const timer = setTimeout(onDismiss, toast.duration)
            return () => clearTimeout(timer)
        }
    }, [toast.duration, onDismiss])

    return (
        <div
            className={cn(
                'flex items-start gap-3 px-4 py-3 bg-center-bg rounded-[var(--radius-modal)] shadow-elevation-3 border border-border-default border-l-4 animate-in slide-in-from-right-5',
                toastColors[toast.type]
            )}
        >
            <Icon size={16} className="shrink-0 mt-0.5" />
            <span className="flex-1 text-sm text-center-fg">{toast.message}</span>
            <button
                onClick={onDismiss}
                className="shrink-0 p-0.5 rounded hover:bg-hover text-center-fg/40 hover:text-center-fg cursor-pointer"
            >
                <X size={14} />
            </button>
        </div>
    )
}
