import React, {createContext, useContext, useState, useCallback} from 'react'
import * as RadixToast from '@radix-ui/react-toast'
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

const ICONS: Record<ToastType, React.ElementType> = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
}

const VARIANT_CLASSES: Record<ToastType, string> = {
    success: 'border-l-4 border-l-success',
    error: 'border-l-4 border-l-destructive',
    warning: 'border-l-4 border-l-warning',
    info: 'border-l-4 border-l-primary',
}

const ICON_CLASSES: Record<ToastType, string> = {
    success: 'text-success',
    error: 'text-destructive',
    warning: 'text-warning',
    info: 'text-primary',
}

export function ToastProvider({children}: {children: React.ReactNode}) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const addToast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
        const id = crypto.randomUUID()
        setToasts((prev) => [...prev, {id, message, type, duration}])
    }, [])

    const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id))

    return (
        <ToastContext.Provider value={{addToast}}>
            <RadixToast.Provider swipeDirection="right">
                {children}
                {toasts.map((toast) => {
                    const Icon = ICONS[toast.type]
                    return (
                        <RadixToast.Root
                            key={toast.id}
                            duration={toast.duration}
                            onOpenChange={(open) => !open && dismiss(toast.id)}
                            className={cn(
                                'bg-card text-card-foreground rounded-[var(--radius-modal)] shadow-elevation-3 px-4 py-3 flex items-start gap-3',
                                'border border-border',
                                VARIANT_CLASSES[toast.type]
                            )}
                        >
                            <Icon size={16} className={cn('shrink-0 mt-0.5', ICON_CLASSES[toast.type])} />
                            <RadixToast.Description className="flex-1 text-sm text-foreground">
                                {toast.message}
                            </RadixToast.Description>
                            <RadixToast.Close
                                onClick={() => dismiss(toast.id)}
                                className="shrink-0 p-0.5 rounded hover:bg-accent text-foreground/40 hover:text-foreground cursor-pointer transition-colors"
                            >
                                <X size={14} />
                            </RadixToast.Close>
                        </RadixToast.Root>
                    )
                })}
                <RadixToast.Viewport className="fixed bottom-4 right-4 flex flex-col gap-2 w-80 z-[100] outline-none" />
            </RadixToast.Provider>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) throw new Error('useToast must be used within a ToastProvider')
    return context
}
