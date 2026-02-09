import React, {useState, useMemo} from 'react'
import {createRoute, Link} from '@tanstack/react-router'
import {Route as authRoute} from './_auth'
import {Layout, Plus, User as UserIcon} from 'lucide-react'
import {useMeQuery} from '../hooks/useAuth'
import {useBoardsQuery} from '../hooks/useBoards'
import {useQueries} from '@tanstack/react-query'
import {blocksApi} from '../api/blocks'
import {DEFAULT_TEAM_ID} from '../lib/constants'
import {Skeleton} from '../components/ui/Skeleton'
import {CreateBoardDialog} from '../components/board/CreateBoardDialog'
import {DashboardStats} from '../components/dashboard/DashboardStats'
import {AssignedCards} from '../components/dashboard/AssignedCards'
import type {Block} from '../api/types'

export const Route = createRoute({
    getParentRoute: () => authRoute,
    path: '/dashboard',
    component: DashboardComponent,
})

function DashboardComponent() {
    const {data: user, isLoading: isUserLoading} = useMeQuery()
    const {data: boards, isLoading: isBoardsLoading} = useBoardsQuery(DEFAULT_TEAM_ID)
    const [showCreateDialog, setShowCreateDialog] = useState(false)

    // Fetch cards from all boards
    const cardQueries = useQueries({
        queries: (boards || []).map((board) => ({
            queryKey: ['blocks', board.id],
            queryFn: () => blocksApi.getBlocks(board.id, {type: 'card'}),
            enabled: !!board.id,
        })),
    })

    const allCards = useMemo(() => {
        return cardQueries.flatMap((query) => (query.data || []) as Block[])
    }, [cardQueries])

    const isCardsLoading = cardQueries.some((q) => q.isLoading)
    const isLoading = isUserLoading || isBoardsLoading

    if (isLoading) {
        return (
            <div className="flex-1 p-8 max-w-5xl mx-auto w-full">
                <Skeleton className="h-10 w-64 mb-8" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-32 rounded-[var(--radius-default)]" />
                    ))}
                </div>
                <Skeleton className="h-8 w-48 mb-6" />
                <Skeleton className="h-40 w-full rounded-[var(--radius-default)]" />
            </div>
        )
    }

    const username = user?.username || user?.nickname || 'User'

    return (
        <div className="flex-1 p-8 max-w-6xl mx-auto w-full overflow-y-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-semibold text-center-fg mb-2">
                    Welcome back, {username}
                </h1>
                <p className="text-center-fg/60">
                    Here's what's happening in your workspace.
                </p>
            </header>

            {/* Dashboard Stats */}
            {boards && boards.length > 0 && !isCardsLoading && (
                <DashboardStats boards={boards} cards={allCards} />
            )}

            {/* Assigned Cards */}
            {user && boards && boards.length > 0 && !isCardsLoading && allCards.length > 0 && (
                <AssignedCards cards={allCards} boards={boards} userId={user.id} />
            )}

            <section className="mb-12">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-center-fg flex items-center gap-2">
                        <Layout className="w-5 h-5 opacity-70" />
                        Your Boards
                    </h2>
                </div>

                {boards && boards.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {boards.map((board) => (
                            <Link
                                key={board.id}
                                to="/board/$boardId"
                                params={{boardId: board.id}}
                                className="group block p-5 rounded-[var(--radius-default)] bg-white border border-black/5 hover:border-black/10 shadow-sm hover:shadow-md transition-all duration-200"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <span className="text-2xl">{board.icon || '📋'}</span>
                                </div>
                                <h3 className="font-medium text-lg text-center-fg group-hover:text-blue-600 transition-colors mb-1 truncate">
                                    {board.title}
                                </h3>
                                <p className="text-sm text-center-fg/50 truncate">
                                    {board.description || 'No description'}
                                </p>
                            </Link>
                        ))}

                        {/* New Board Button */}
                        <button
                            onClick={() => setShowCreateDialog(true)}
                            className="flex flex-col items-center justify-center p-5 rounded-[var(--radius-default)] border border-dashed border-black/20 hover:border-blue-500/50 hover:bg-blue-50/50 transition-all duration-200 group h-full min-h-[140px]"
                        >
                            <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center mb-3 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                <Plus size={20} />
                            </div>
                            <span className="font-medium text-center-fg/70 group-hover:text-blue-600">Create New Board</span>
                        </button>
                    </div>
                ) : (
                    <div className="text-center py-12 bg-black/5 rounded-[var(--radius-default)] border border-dashed border-black/10">
                        <Layout className="w-12 h-12 mx-auto text-center-fg/20 mb-3" />
                        <h3 className="text-lg font-medium text-center-fg/70 mb-1">No boards yet</h3>
                        <p className="text-center-fg/50 mb-4">Create your first board to get started.</p>
                        <button
                            onClick={() => setShowCreateDialog(true)}
                            className="px-4 py-2 bg-button-bg text-button-fg rounded-[var(--radius-default)] hover:opacity-90 transition-opacity font-medium"
                        >
                            Create Board
                        </button>
                    </div>
                )}
            </section>

            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-center-fg flex items-center gap-2">
                        <UserIcon className="w-5 h-5 opacity-70" />
                        Recent Mentions
                    </h2>
                    <span className="text-xs font-medium px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">Coming Soon</span>
                </div>

                <div className="bg-white rounded-[var(--radius-default)] border border-black/5 p-8 text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">@</span>
                    </div>
                    <h3 className="text-lg font-medium text-center-fg mb-2">Stay in the loop</h3>
                    <p className="text-center-fg/60 max-w-md mx-auto">
                        Soon you'll see all your mentions and notifications right here, so you never miss an important update from your team.
                    </p>
                </div>
            </section>

            {/* Create Board Dialog */}
            <CreateBoardDialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} teamId={DEFAULT_TEAM_ID} />
        </div>
    )
}
