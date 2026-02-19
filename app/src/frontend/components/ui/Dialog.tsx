import React from 'react'
import * as RadixDialog from '@radix-ui/react-dialog'
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
    return (
        <RadixDialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
            <RadixDialog.Portal>
                <RadixDialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
                <RadixDialog.Content
                    className={cn(
                        'fixed left-1/2 top-[10vh] z-50 -translate-x-1/2',
                        'w-full bg-card text-card-foreground rounded-[var(--radius-modal)] shadow-elevation-4 overflow-hidden',
                        maxWidth,
                        className
                    )}
                    onInteractOutside={(e) => { e.preventDefault(); onClose() }}
                    onEscapeKeyDown={onClose}
                >
                    {(title || showClose) && (
                        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                            {title && (
                                <RadixDialog.Title className="font-semibold text-sm text-foreground">
                                    {title}
                                </RadixDialog.Title>
                            )}
                            {showClose && (
                                <RadixDialog.Close
                                    onClick={onClose}
                                    className="ml-auto p-1 rounded text-foreground/50 hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
                                    aria-label="Close"
                                >
                                    <X size={16} />
                                </RadixDialog.Close>
                            )}
                        </div>
                    )}
                    {children}
                </RadixDialog.Content>
            </RadixDialog.Portal>
        </RadixDialog.Root>
    )
}
