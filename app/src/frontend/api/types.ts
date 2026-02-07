export interface User {
    id: string
    username: string
    email: string
    nickname: string
    firstname: string
    lastname: string
    props: Record<string, any>
    createAt: number
    updateAt: number
    deleteAt: number
}

export interface Board {
    id: string
    teamId: string
    channelId?: string
    createdBy: string
    modifiedBy: string
    type: 'public' | 'private'
    title: string
    description: string
    icon?: string
    showDescription: boolean
    isTemplate: boolean
    templateVersion: number
    properties: Record<string, any>
    cardProperties: IPropertyTemplate[]
    createAt: number
    updateAt: number
    deleteAt: number
}

export interface IPropertyTemplate {
    id: string
    name: string
    type: PropertyType
    options: IPropertyOption[]
}

export type PropertyType =
    | 'text'
    | 'number'
    | 'select'
    | 'multiSelect'
    | 'date'
    | 'person'
    | 'file'
    | 'checkbox'
    | 'url'
    | 'email'
    | 'phone'
    | 'createdTime'
    | 'createdBy'
    | 'updatedTime'
    | 'updatedBy'

export interface IPropertyOption {
    id: string
    value: string
    color: string
}

export interface Block {
    id: string
    parentId: string
    boardId: string
    createdBy: string
    modifiedBy: string
    schema: number
    type: BlockType
    title: string
    fields: Record<string, any>
    createAt: number
    updateAt: number
    deleteAt: number
}

export type BlockType = 'card' | 'view' | 'text' | 'image' | 'divider' | 'checkbox' | 'comment'

export interface Card extends Block {
    type: 'card'
}

export interface BoardView extends Block {
    type: 'view'
    fields: ViewFields
}

export interface ViewFields {
    viewType: ViewType
    sortOptions?: SortOption[]
    visiblePropertyIds?: string[]
    visibleOptionIds?: string[]
    hiddenOptionIds?: string[]
    collapsedOptionIds?: string[]
    filter?: FilterGroup
    cardOrder?: string[]
    columnWidths?: Record<string, number>
    columnCalculations?: Record<string, string>
    kanbanCalculations?: Record<string, string>
    defaultTemplateId?: string
    groupById?: string
    dateDisplayPropertyId?: string
}

export type ViewType = 'board' | 'table' | 'gallery' | 'calendar'

export interface SortOption {
    propertyId: string
    reversed: boolean
}

export interface FilterGroup {
    operation: 'and' | 'or'
    filters: FilterClause[]
}

export interface FilterClause {
    propertyId: string
    condition: string
    values: string[]
}

export interface Team {
    id: string
    title: string
    name: string
    description: string
}

export interface Category {
    id: string
    name: string
    userId: string
    teamId: string
    boardIds: string[]
    createAt: number
    updateAt: number
    deleteAt: number
    collapsed: boolean
}

export interface BoardMember {
    boardId: string
    userId: string
    roles: string
    schemeAdmin: boolean
    schemeEditor: boolean
    schemeCommenter: boolean
    schemeViewer: boolean
}

export interface Sharing {
    id: string
    enabled: boolean
    token: string
    modifiedBy: string
    updateAt: number
}

export interface Subscription {
    blockType: string
    blockId: string
    subscriberType: string
    subscriberId: string
    notifiedAt: number
    createAt: number
    deleteAt: number
}
