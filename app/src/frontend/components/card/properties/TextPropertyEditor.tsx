import React, {useState} from 'react'
import {cn} from '../../../lib/cn'

interface TextPropertyEditorProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    type?: 'text' | 'number' | 'url' | 'email' | 'phone'
}

export function TextPropertyEditor({value, onChange, placeholder = 'Empty', type = 'text'}: TextPropertyEditorProps) {
    const [editing, setEditing] = useState(false)
    const [draft, setDraft] = useState(value || '')

    const save = () => {
        if (draft !== (value || '')) {
            onChange(draft)
        }
        setEditing(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            save()
        }
        if (e.key === 'Escape') {
            setDraft(value || '')
            setEditing(false)
        }
    }

    if (!editing) {
        return (
            <div
                onClick={() => { setDraft(value || ''); setEditing(true) }}
                className={cn(
                    'text-xs min-h-[24px] px-1 py-0.5 rounded cursor-pointer hover:bg-hover transition-colors flex items-center',
                    value ? 'text-center-fg/70' : 'text-center-fg/30'
                )}
            >
                {type === 'url' && value ? (
                    <a href={value} target="_blank" rel="noopener noreferrer" className="text-link hover:underline" onClick={(e) => e.stopPropagation()}>
                        {value}
                    </a>
                ) : (
                    value || placeholder
                )}
            </div>
        )
    }

    return (
        <input
            type={type === 'number' ? 'number' : 'text'}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={save}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="text-xs w-full bg-transparent border border-button-bg rounded px-1 py-0.5 outline-none text-center-fg"
            autoFocus
        />
    )
}
