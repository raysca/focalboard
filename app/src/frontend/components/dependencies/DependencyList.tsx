import { DependencyItem } from './DependencyItem'
import type {
    CardDependencyWithCards,
    DependencyType,
} from '../../../backend/types/dependencies'

interface DependencyListProps {
    title: string
    type: DependencyType
    items: CardDependencyWithCards[]
    onRemove: (depId: string) => void
    variant?: 'default' | 'warning' | 'info'
}

export function DependencyList({
    title,
    type,
    items,
    onRemove,
    variant = 'default',
}: DependencyListProps) {
    const variantClasses = {
        default: 'border-border-default bg-hover',
        warning: 'border-error/30 bg-error/5',
        info: 'border-link/30 bg-link/5',
    }

    return (
        <div className={`border rounded-[var(--radius-default)] p-4 space-y-3 ${variantClasses[variant]}`}>
            <div className="flex items-center gap-2.5">
                <h4 className="text-sm font-semibold text-center-fg">{title}</h4>
                <span className="px-2.5 py-0.5 text-xs bg-center-bg text-center-fg/70 rounded-full border border-border-default font-medium">
                    {items.length}
                </span>
            </div>
            <div className="space-y-2">
                {items.map((dep) => (
                    <DependencyItem
                        key={dep.id}
                        dependency={dep}
                        onRemove={() => onRemove(dep.id)}
                    />
                ))}
            </div>
        </div>
    )
}
