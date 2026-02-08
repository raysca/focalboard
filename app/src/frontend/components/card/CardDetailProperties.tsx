import React from 'react'
import type {IPropertyTemplate} from '../../api/types'
import {SelectPropertyEditor} from './properties/SelectPropertyEditor'
import {MultiSelectPropertyEditor} from './properties/MultiSelectPropertyEditor'
import {TextPropertyEditor} from './properties/TextPropertyEditor'
import {CheckboxPropertyEditor} from './properties/CheckboxPropertyEditor'
import {DatePropertyEditor} from './properties/DatePropertyEditor'
import {PersonPropertyEditor} from './properties/PersonPropertyEditor'

interface CardDetailPropertiesProps {
    properties: Record<string, any>
    cardProperties: IPropertyTemplate[]
    onPropertyChange: (propertyId: string, value: any) => void
}

export function CardDetailProperties({properties, cardProperties, onPropertyChange}: CardDetailPropertiesProps) {
    if (!cardProperties || cardProperties.length === 0) return null

    return (
        <div className="px-6 py-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-center-fg/50 mb-3">
                Properties
            </h3>
            <div className="space-y-2">
                {cardProperties.map((prop) => {
                    const value = properties[prop.id]

                    return (
                        <div key={prop.id} className="flex items-start gap-3 min-h-[28px]">
                            <span className="text-xs text-center-fg/50 w-[120px] shrink-0 pt-1 select-none">
                                {prop.name}
                            </span>
                            <div className="flex-1 min-w-0">
                                {renderPropertyEditor(prop, value, (val) => onPropertyChange(prop.id, val))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function renderPropertyEditor(
    template: IPropertyTemplate,
    value: any,
    onChange: (value: any) => void
) {
    switch (template.type) {
        case 'select':
            return (
                <SelectPropertyEditor
                    template={template}
                    value={value || ''}
                    onChange={onChange}
                />
            )

        case 'multiSelect':
            return (
                <MultiSelectPropertyEditor
                    template={template}
                    value={Array.isArray(value) ? value : value ? [value] : []}
                    onChange={onChange}
                />
            )

        case 'checkbox':
            return (
                <CheckboxPropertyEditor
                    value={value || 'false'}
                    onChange={onChange}
                />
            )

        case 'date':
            return (
                <DatePropertyEditor
                    value={value || ''}
                    onChange={onChange}
                />
            )

        case 'person':
            return (
                <PersonPropertyEditor
                    value={value || ''}
                    onChange={onChange}
                />
            )

        case 'url':
        case 'email':
        case 'phone':
            return (
                <TextPropertyEditor
                    value={value || ''}
                    onChange={onChange}
                    type={template.type as any}
                    placeholder={`Add ${template.type}...`}
                />
            )

        case 'number':
            return (
                <TextPropertyEditor
                    value={value || ''}
                    onChange={onChange}
                    type="number"
                    placeholder="0"
                />
            )

        case 'createdTime':
        case 'updatedTime':
            return (
                <div className="text-xs text-center-fg/50 px-1 py-0.5">
                    {value ? new Date(value).toLocaleString() : '—'}
                </div>
            )

        case 'createdBy':
        case 'updatedBy':
            return (
                <div className="text-xs text-center-fg/50 px-1 py-0.5">
                    {value || '—'}
                </div>
            )

        default:
            return (
                <TextPropertyEditor
                    value={value || ''}
                    onChange={onChange}
                    placeholder="Empty"
                />
            )
    }
}
