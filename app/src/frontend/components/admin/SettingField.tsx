import React from 'react'
import type { AdminSetting } from '../../api/admin'

interface SettingFieldProps {
    setting: AdminSetting
    value: unknown
    onChange: (value: unknown) => void
    disabled?: boolean
}

export function SettingField({ setting, value, onChange, disabled }: SettingFieldProps) {
    const renderInput = () => {
        switch (setting.valueType) {
            case 'boolean':
                return (
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id={setting.id}
                            checked={value as boolean}
                            onChange={(e) => onChange(e.target.checked)}
                            disabled={disabled}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            data-testid={`setting-${setting.id}`}
                        />
                        <label htmlFor={setting.id} className="text-sm text-gray-700">
                            {setting.description}
                        </label>
                    </div>
                )

            case 'number':
                return (
                    <div className="space-y-1">
                        <label htmlFor={setting.id} className="block text-sm font-medium text-gray-700">
                            {setting.description}
                        </label>
                        <input
                            type="number"
                            id={setting.id}
                            value={value as number}
                            onChange={(e) => onChange(Number(e.target.value))}
                            disabled={disabled}
                            min={setting.constraints.min as number | undefined}
                            max={setting.constraints.max as number | undefined}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {(setting.constraints.min || setting.constraints.max) && (
                            <p className="text-xs text-gray-500">
                                {setting.constraints.min && `Min: ${setting.constraints.min}`}
                                {setting.constraints.min && setting.constraints.max && ' • '}
                                {setting.constraints.max && `Max: ${setting.constraints.max}`}
                            </p>
                        )}
                    </div>
                )

            case 'string':
                if (setting.constraints.enum && Array.isArray(setting.constraints.enum)) {
                    return (
                        <div className="space-y-1">
                            <label htmlFor={setting.id} className="block text-sm font-medium text-gray-700">
                                {setting.description}
                            </label>
                            <select
                                id={setting.id}
                                value={value as string}
                                onChange={(e) => onChange(e.target.value)}
                                disabled={disabled}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {(setting.constraints.enum as string[]).map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )
                }

                return (
                    <div className="space-y-1">
                        <label htmlFor={setting.id} className="block text-sm font-medium text-gray-700">
                            {setting.description}
                        </label>
                        <input
                            type="text"
                            id={setting.id}
                            value={value as string}
                            onChange={(e) => onChange(e.target.value)}
                            disabled={disabled}
                            minLength={setting.constraints.minLength as number | undefined}
                            maxLength={setting.constraints.maxLength as number | undefined}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                )

            case 'json':
                return (
                    <div className="space-y-1">
                        <label htmlFor={setting.id} className="block text-sm font-medium text-gray-700">
                            {setting.description}
                        </label>
                        <textarea
                            id={setting.id}
                            value={JSON.stringify(value, null, 2)}
                            onChange={(e) => {
                                try {
                                    onChange(JSON.parse(e.target.value))
                                } catch {
                                    // Invalid JSON, ignore
                                }
                            }}
                            disabled={disabled}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                )

            default:
                return <p className="text-sm text-gray-500">Unsupported setting type</p>
        }
    }

    return (
        <div className="py-4">
            {renderInput()}
        </div>
    )
}
