import React, { useState, useEffect } from 'react'
import { useSettings, useBulkUpdateSettings } from '../../hooks/useAdminSettings'
import { SettingField } from './SettingField'
import type { AdminSetting } from '../../api/admin'

export function AuthSettings() {
    const { data: settings, isLoading } = useSettings('auth')
    const bulkUpdate = useBulkUpdateSettings()
    const [formData, setFormData] = useState<Record<string, unknown>>({})
    const [successMessage, setSuccessMessage] = useState('')

    useEffect(() => {
        if (settings) {
            const initialData: Record<string, unknown> = {}
            settings.forEach((setting) => {
                initialData[setting.id] = setting.value
            })
            setFormData(initialData)
        }
    }, [settings])

    const handleChange = (id: string, value: unknown) => {
        setFormData((prev) => ({ ...prev, [id]: value }))
    }

    const handleSave = async () => {
        if (!settings) return

        const updates = settings
            .filter((setting) => formData[setting.id] !== setting.value)
            .map((setting) => ({
                id: setting.id,
                value: formData[setting.id],
            }))

        if (updates.length === 0) {
            return
        }

        try {
            await bulkUpdate.mutateAsync(updates)
            setSuccessMessage('Settings saved successfully')
            setTimeout(() => setSuccessMessage(''), 3000)
        } catch (error) {
            console.error('Failed to save settings:', error)
        }
    }

    if (isLoading) {
        return <div className="p-6">Loading...</div>
    }

    if (!settings || settings.length === 0) {
        return <div className="p-6">No authentication settings found</div>
    }

    return (
        <div className="max-w-2xl">
            <h2 className="text-2xl font-bold mb-6">Authentication Settings</h2>

            <div className="bg-white rounded-lg shadow p-6 space-y-4">
                {settings.map((setting: AdminSetting) => (
                    <SettingField
                        key={setting.id}
                        setting={setting}
                        value={formData[setting.id] ?? setting.value}
                        onChange={(value) => handleChange(setting.id, value)}
                    />
                ))}

                <div className="flex items-center gap-4 pt-4 border-t">
                    <button
                        onClick={handleSave}
                        disabled={bulkUpdate.isPending}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        data-testid="save-settings-button"
                    >
                        {bulkUpdate.isPending ? 'Saving...' : 'Save Changes'}
                    </button>

                    {successMessage && (
                        <span className="text-sm text-green-600" data-testid="success-message">{successMessage}</span>
                    )}
                </div>
            </div>
        </div>
    )
}
