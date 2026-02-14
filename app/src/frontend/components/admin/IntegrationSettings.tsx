import React from 'react'

export function IntegrationSettings() {
    return (
        <div className="max-w-2xl">
            <h2 className="text-2xl font-bold mb-6">Integration Settings</h2>

            <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600">
                    Integration settings will be available in a future update.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                    This section will include webhooks, SMTP configuration, and export options.
                </p>
            </div>
        </div>
    )
}
