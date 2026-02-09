import React, {useState} from 'react'
import {Link, useNavigate} from '@tanstack/react-router'
import {Plus, Search, ChevronLeft, ChevronRight, Home} from 'lucide-react'
import {cn} from '../../lib/cn'
import {DEFAULT_TEAM_ID} from '../../lib/constants'
import {useBoardsQuery, useCreateBoardMutation} from '../../hooks/useBoards'
import {useInsertBlocksMutation} from '../../hooks/useBlocks'
import {useCategoriesQuery} from '../../hooks/useCategories'
import {useUI} from '../../contexts/UIContext'
import {SidebarCategory} from './SidebarCategory'
import {SidebarUserMenu} from './SidebarUserMenu'
import type {Board, Category} from '../../api/types'

function defaultCardProperties() {
    const statusId = crypto.randomUUID()
    const priorityId = crypto.randomUUID()
    return {
        statusId,
        priorityId,
        cardProperties: [
            {
                id: statusId,
                name: 'Status',
                type: 'select',
                options: [
                    {id: crypto.randomUUID(), value: 'To Do', color: 'default'},
                    {id: crypto.randomUUID(), value: 'In Progress', color: 'yellow'},
                    {id: crypto.randomUUID(), value: 'Done', color: 'green'},
                ],
            },
            {
                id: priorityId,
                name: 'Priority',
                type: 'select',
                options: [
                    {id: crypto.randomUUID(), value: 'High', color: 'red'},
                    {id: crypto.randomUUID(), value: 'Medium', color: 'orange'},
                    {id: crypto.randomUUID(), value: 'Low', color: 'blue'},
                ],
            },
        ],
    }
}

interface SidebarProps {
    activeBoardId?: string
}

export function Sidebar({activeBoardId}: SidebarProps) {
    const {sidebarCollapsed, toggleSidebar} = useUI()
    const {data: boards = []} = useBoardsQuery(DEFAULT_TEAM_ID)
    const {data: categories = []} = useCategoriesQuery(DEFAULT_TEAM_ID)
    const createBoard = useCreateBoardMutation(DEFAULT_TEAM_ID)
    const navigate = useNavigate()
    const [searchTerm, setSearchTerm] = useState('')

    const nonTemplateBoards = boards.filter((b: Board) => !b.isTemplate && b.deleteAt === 0)

    const filteredBoards = searchTerm
        ? nonTemplateBoards.filter((b: Board) =>
            b.title.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : nonTemplateBoards

    // Build categorized and uncategorized boards
    const categorizedBoardIds = new Set(categories.flatMap((c: Category) => c.boardIds || []))
    const uncategorizedBoards = filteredBoards.filter((b: Board) => !categorizedBoardIds.has(b.id))

    const handleAddBoard = () => {
        const {statusId, priorityId, cardProperties} = defaultCardProperties()
        createBoard.mutate(
            {
                title: 'Untitled Board',
                type: 'private',
                cardProperties,
            },
            {
                onSuccess: (board) => {
                    // Create a default kanban view
                    const viewBlock = {
                        boardId: board.id,
                        parentId: board.id,
                        type: 'view',
                        title: 'Board',
                        fields: {
                            viewType: 'board',
                            groupById: statusId,
                            visiblePropertyIds: [priorityId],
                            sortOptions: [],
                            filter: {operation: 'and', filters: []},
                            cardOrder: [],
                            collapsedOptionIds: [],
                            hiddenOptionIds: [],
                            columnWidths: {},
                        },
                        schema: 1,
                    }
                    // Fire and forget — the board page will pick it up on query refetch
                    import('../../api/blocks').then(({blocksApi}) => {
                        blocksApi.insertBlocks(board.id, [viewBlock as any])
                    })
                    navigate({to: '/board/$boardId', params: {boardId: board.id}})
                },
            }
        )
    }

    if (sidebarCollapsed) {
        return (
            <div className="flex flex-col items-center w-10 h-full bg-sidebar-bg py-4">
                <button
                    onClick={toggleSidebar}
                    className="p-1 rounded text-sidebar-fg/60 hover:text-sidebar-fg hover:bg-white/10 transition-colors"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        )
    }

    return (
        <div className="shrink-0 w-[var(--sidebar-width)] flex flex-col h-full bg-sidebar-bg text-sidebar-fg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between h-12 px-4">
                <span className="font-semibold text-sm text-sidebar-text-primary truncate">
                    Focalboard
                </span>
                <button
                    onClick={toggleSidebar}
                    className="p-1 rounded text-sidebar-text-secondary hover:text-sidebar-fg hover:bg-white/10 transition-colors"
                >
                    <ChevronLeft size={16} />
                </button>
            </div>

            {/* Search */}
            <div className="px-3 mb-2">
                <div className="flex items-center h-8 px-2 rounded bg-white/10 text-sidebar-text-secondary">
                    <Search size={14} className="shrink-0 mr-2" />
                    <input
                        type="text"
                        placeholder="Search boards..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-transparent text-xs text-sidebar-fg placeholder:text-sidebar-text-secondary border-none outline-none"
                    />
                </div>
            </div>

            {/* Dashboard link */}
            <Link
                to="/dashboard"
                className={cn(
                    'flex items-center h-8 px-5 mx-3 mb-2 rounded-[var(--radius-default)] cursor-pointer transition-colors no-underline',
                    'text-sidebar-fg/80 hover:bg-white/10 hover:text-sidebar-fg',
                    !activeBoardId && 'bg-white/20 text-sidebar-fg font-medium'
                )}
            >
                <Home size={16} className="mr-2 shrink-0" />
                <span className="text-sm">Dashboard</span>
            </Link>

            {/* Board list */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden pb-4">
                {/* Categories */}
                {categories.map((category: Category) => {
                    const categoryBoards = filteredBoards.filter((b: Board) =>
                        (category.boardIds || []).includes(b.id)
                    )
                    return (
                        <SidebarCategory
                            key={category.id}
                            category={category}
                            boards={categoryBoards}
                            activeBoardId={activeBoardId}
                        />
                    )
                })}

                {/* Uncategorized boards */}
                {uncategorizedBoards.length > 0 && (
                    <SidebarCategory
                        category={{id: '__uncategorized', name: 'Boards', boardIds: [], collapsed: false} as Category}
                        boards={uncategorizedBoards}
                        activeBoardId={activeBoardId}
                    />
                )}

                {/* No boards */}
                {nonTemplateBoards.length === 0 && (
                    <div className="px-5 py-4 text-xs text-sidebar-text-secondary">
                        No boards yet. Create one to get started.
                    </div>
                )}
            </div>

            {/* Add board button */}
            <button
                onClick={handleAddBoard}
                className="flex items-center h-10 px-5 text-sidebar-text-secondary hover:bg-white/10 hover:text-sidebar-fg transition-colors cursor-pointer border-t border-white/10"
            >
                <Plus size={16} className="mr-2" />
                <span className="text-sm">Add board</span>
            </button>

            {/* User menu */}
            <SidebarUserMenu />
        </div>
    )
}
