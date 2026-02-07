import React from 'react'
import {Check} from 'lucide-react'
import {cn} from '../../../lib/cn'

interface CheckboxPropertyEditorProps {
    value: string
    onChange: (value: string) => void
}

export function CheckboxPropertyEditor({value, onChange}: CheckboxPropertyEditorProps) {
    const checked = value === 'true'

    return (
        <button
            onClick={() => onChange(checked ? 'false' : 'true')}
            className={cn(
                'w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-colors',
                checked
                    ? 'bg-button-bg border-button-bg text-button-fg'
                    : 'border-center-fg/30 hover:border-center-fg/50'
            )}
        >
            {checked && <Check size={12} />}
        </button>
    )
}
