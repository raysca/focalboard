import React, {useEffect, useState} from 'react'
import {createPortal} from 'react-dom'

interface TourBackdropProps {
    targetElement: HTMLElement | null
    show: boolean
}

export function TourBackdrop({targetElement, show}: TourBackdropProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted || !show) return null

    // Get target element position and dimensions
    let highlightStyle: React.CSSProperties = {}

    if (targetElement) {
        const rect = targetElement.getBoundingClientRect()
        const padding = 8 // Add some padding around the highlighted element

        highlightStyle = {
            clipPath: `polygon(
                0% 0%,
                0% 100%,
                ${rect.left - padding}px 100%,
                ${rect.left - padding}px ${rect.top - padding}px,
                ${rect.right + padding}px ${rect.top - padding}px,
                ${rect.right + padding}px ${rect.bottom + padding}px,
                ${rect.left - padding}px ${rect.bottom + padding}px,
                ${rect.left - padding}px 100%,
                100% 100%,
                100% 0%
            )`,
        }
    }

    return createPortal(
        <div
            className="fixed inset-0 bg-black/50 transition-opacity duration-300 z-40"
            style={highlightStyle}
            aria-hidden="true"
        />,
        document.body
    )
}
