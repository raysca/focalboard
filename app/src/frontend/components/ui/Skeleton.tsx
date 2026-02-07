import React from 'react'
import {cn} from '../../lib/cn'

interface SkeletonProps {
    className?: string
}

export function Skeleton({className}: SkeletonProps) {
    return (
        <div className={cn('animate-pulse bg-center-fg/10 rounded', className)} />
    )
}

export function SkeletonCard() {
    return (
        <div className="rounded-[var(--radius-default)] p-3 px-4 shadow-card bg-center-bg">
            <Skeleton className="h-4 w-3/4 mb-3" />
            <div className="flex gap-1">
                <Skeleton className="h-5 w-16 rounded-sm" />
                <Skeleton className="h-5 w-12 rounded-sm" />
            </div>
        </div>
    )
}

export function SkeletonKanban() {
    return (
        <div className="flex gap-4 p-6">
            {[1, 2, 3].map((col) => (
                <div key={col} className="shrink-0 w-[var(--kanban-column-width)]">
                    <Skeleton className="h-4 w-20 mb-4" />
                    <div className="flex flex-col gap-2">
                        <SkeletonCard />
                        <SkeletonCard />
                        {col === 1 && <SkeletonCard />}
                    </div>
                </div>
            ))}
        </div>
    )
}

export function SkeletonTable() {
    return (
        <div className="p-4">
            <div className="border-b border-border-default pb-2 mb-2 flex gap-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
            </div>
            {[1, 2, 3, 4, 5].map((row) => (
                <div key={row} className="flex gap-4 py-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                </div>
            ))}
        </div>
    )
}

export function SkeletonSidebar() {
    return (
        <div className="w-[var(--sidebar-width)] bg-sidebar-bg p-4">
            <Skeleton className="h-5 w-24 mb-6 bg-white/10" />
            <Skeleton className="h-8 w-full mb-4 bg-white/10" />
            {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-8 w-full mb-1 bg-white/10" />
            ))}
        </div>
    )
}
