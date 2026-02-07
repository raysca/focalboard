import React, {useState, useRef, useEffect} from 'react'
import {cn} from '../../lib/cn'

interface EditableProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    className?: string
    inputClassName?: string
    saveOnBlur?: boolean
    multiline?: boolean
}

export function Editable({value, onChange, placeholder = 'Empty', className, inputClassName, saveOnBlur = true, multiline = false}: EditableProps) {
    const [editing, setEditing] = useState(false)
    const [draft, setDraft] = useState(value)
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

    useEffect(() => {
        setDraft(value)
    }, [value])

    useEffect(() => {
        if (editing && inputRef.current) {
            inputRef.current.focus()
            inputRef.current.select()
        }
    }, [editing])

    const save = () => {
        if (draft !== value) {
            onChange(draft)
        }
        setEditing(false)
    }

    const cancel = () => {
        setDraft(value)
        setEditing(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !multiline) {
            e.preventDefault()
            save()
        }
        if (e.key === 'Escape') {
            e.preventDefault()
            cancel()
        }
    }

    if (!editing) {
        return (
            <div
                onClick={() => setEditing(true)}
                className={cn(
                    'cursor-pointer rounded px-1 py-0.5 min-h-[24px] hover:bg-hover transition-colors',
                    !value && 'text-center-fg/30',
                    className
                )}
            >
                {value || placeholder}
            </div>
        )
    }

    const sharedProps = {
        ref: inputRef as any,
        value: draft,
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
        onBlur: saveOnBlur ? save : undefined,
        onKeyDown: handleKeyDown,
        placeholder,
        className: cn(
            'w-full bg-transparent border border-button-bg rounded px-1 py-0.5 outline-none text-center-fg',
            inputClassName
        ),
    }

    if (multiline) {
        return <textarea {...sharedProps} rows={3} />
    }

    return <input type="text" {...sharedProps} />
}
