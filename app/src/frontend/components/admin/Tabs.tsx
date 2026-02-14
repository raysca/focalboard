import React from 'react'

interface Tab {
    id: string
    label: string
    icon?: string
}

interface TabsProps {
    tabs: Tab[]
    activeTab: string
    onTabChange: (tabId: string) => void
}

export function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
    return (
        <nav className="w-64 border-r border-gray-200 bg-gray-50 p-4">
            <div className="space-y-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`
                            w-full text-left px-4 py-2 rounded-md text-sm font-medium transition-colors
                            ${
                                activeTab === tab.id
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-700 hover:bg-gray-200'
                            }
                        `}
                    >
                        {tab.icon && <span className="mr-2">{tab.icon}</span>}
                        {tab.label}
                    </button>
                ))}
            </div>
        </nav>
    )
}
