import React, {useState} from 'react'
import {cn} from '../../../lib/cn'

interface DatePropertyEditorProps {
    value: string
    onChange: (value: string) => void
}

export function DatePropertyEditor({value, onChange}: DatePropertyEditorProps) {
    let displayDate = ''
    let dateValue = ''

    try {
        const parsed = value ? JSON.parse(value) : {}
        if (parsed.from) {
            displayDate = new Date(parsed.from).toLocaleDateString()
            dateValue = new Date(parsed.from).toISOString().split('T')[0] || ''
        }
    } catch {
        displayDate = value || ''
    }

    const [editing, setEditing] = useState(false)

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = e.target.value
        if (newDate) {
            onChange(JSON.stringify({from: new Date(newDate).getTime()}))
        } else {
            onChange('')
        }
        setEditing(false)
    }

    if (!editing) {
        return (
            <div
                onClick={() => setEditing(true)}
                className={cn(
                    'text-xs min-h-[24px] px-1 py-0.5 rounded cursor-pointer hover:bg-hover transition-colors flex items-center',
                    displayDate ? 'text-center-fg/70' : 'text-center-fg/30'
                )}
            >
                {displayDate || 'Empty'}
            </div>
        )
    }

    return (
        <input
            type="date"
            value={dateValue}
            onChange={handleDateChange}
            onBlur={() => setEditing(false)}
            className="text-xs bg-transparent border border-button-bg rounded px-1 py-0.5 outline-none text-center-fg"
            autoFocus
        />
    )
}
