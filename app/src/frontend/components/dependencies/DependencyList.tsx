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
        default: 'border-gray-300 bg-gray-50',
        warning: 'border-red-300 bg-red-50',
        info: 'border-blue-300 bg-blue-50',
    }

    return (
        <div className={`border rounded-lg p-4 space-y-2 ${variantClasses[variant]}`}>
            <div className="flex items-center gap-2 mb-3">
                <h4 className="text-sm font-medium">{title}</h4>
                <span className="px-2 py-0.5 text-xs bg-white rounded-full border">
                    {items.length}
                </span>
            </div>
            <div className="space-y-1">
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
