import React, {useEffect, useRef} from 'react'
import {X} from 'lucide-react'
import {cn} from '../../lib/cn'

interface DialogProps {
    open: boolean
    onClose: () => void
    title?: string
    className?: string
    children: React.ReactNode
    showClose?: boolean
    maxWidth?: string
}

export function Dialog({open, onClose, title, className, children, showClose = true, maxWidth = 'max-w-lg'}: DialogProps) {
    const dialogRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [open, onClose])

    if (!open) return null

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-[10vh]" onClick={onClose}>
            <div
                ref={dialogRef}
                className={cn(
                    'bg-center-bg rounded-[var(--radius-modal)] shadow-elevation-4 w-full overflow-hidden',
                    maxWidth,
                    className
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {(title || showClose) && (
                    <div className="flex items-center justify-between px-5 py-3 border-b border-border-default">
                        {title && <h3 className="font-semibold text-sm">{title}</h3>}
                        {showClose && (
                            <button
                                onClick={onClose}
                                className="p-1 rounded hover:bg-hover transition-colors cursor-pointer text-center-fg/50 hover:text-center-fg ml-auto"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                )}
                {children}
            </div>
        </div>
    )
}
