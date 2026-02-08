import React, {useState, useMemo} from 'react'
import {Send} from 'lucide-react'
import {useUsersByIdsQuery, getUserDisplay} from '../../hooks/useUsers'
import type {Block} from '../../api/types'

interface CommentsListProps {
    comments: Block[]
    onAddComment: (text: string) => void
}

export function CommentsList({comments, onAddComment}: CommentsListProps) {
    const [draft, setDraft] = useState('')

    // Collect unique user IDs from all comments and resolve them
    const userIds = useMemo(() => {
        const ids = new Set<string>()
        for (const c of comments) {
            if (c.createdBy) ids.add(c.createdBy)
        }
        return Array.from(ids)
    }, [comments])

    const {data: users} = useUsersByIdsQuery(userIds)

    const userMap = useMemo(() => {
        const map: Record<string, {name: string; initials: string}> = {}
        if (users) {
            for (const u of users) {
                map[u.id] = getUserDisplay(u)
            }
        }
        return map
    }, [users])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!draft.trim()) return
        onAddComment(draft.trim())
        setDraft('')
    }

    const sortedComments = [...comments].sort((a, b) => (b.createAt || 0) - (a.createAt || 0))

    return (
        <div className="px-6 py-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-center-fg/50 mb-3">
                Comments
            </h3>

            {/* Add comment form */}
            <form onSubmit={handleSubmit} className="flex items-start gap-2 mb-4">
                <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Add a comment..."
                    rows={2}
                    className="flex-1 text-sm bg-transparent border border-border-default rounded-[var(--radius-default)] px-3 py-2 outline-none focus:border-button-bg resize-none text-center-fg placeholder:text-center-fg/30"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            e.preventDefault()
                            handleSubmit(e)
                        }
                    }}
                />
                <button
                    type="submit"
                    disabled={!draft.trim()}
                    className="h-9 px-3 rounded bg-button-bg text-button-fg hover:bg-button-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                    <Send size={14} />
                </button>
            </form>

            {/* Comment list */}
            <div className="space-y-3">
                {sortedComments.map((comment) => {
                    const display = userMap[comment.createdBy] || {
                        name: comment.createdBy || 'User',
                        initials: (comment.createdBy || 'U').charAt(0).toUpperCase(),
                    }

                    return (
                        <div key={comment.id} className="flex gap-2">
                            <div className="w-6 h-6 rounded-full bg-button-bg/20 flex items-center justify-center text-[10px] font-bold text-button-bg shrink-0 mt-0.5">
                                {display.initials}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2 mb-0.5">
                                    <span className="text-xs font-medium text-center-fg/80">
                                        {display.name}
                                    </span>
                                    <span className="text-[10px] text-center-fg/30">
                                        {comment.createAt ? new Date(comment.createAt).toLocaleString() : ''}
                                    </span>
                                </div>
                                <div className="text-sm text-center-fg/80 whitespace-pre-wrap">
                                    {comment.title}
                                </div>
                            </div>
                        </div>
                    )
                })}

                {sortedComments.length === 0 && (
                    <div className="text-xs text-center-fg/30">
                        No comments yet. Use Ctrl+Enter to submit.
                    </div>
                )}
            </div>
        </div>
    )
}
