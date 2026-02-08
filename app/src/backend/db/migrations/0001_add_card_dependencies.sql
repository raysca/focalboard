-- Migration: Add card_dependencies table
-- Created: 2024-02-08
-- Description: Adds support for card-to-card dependencies (blocking, related, duplicate, parent/child)

CREATE TABLE IF NOT EXISTS card_dependencies (
    id TEXT PRIMARY KEY,
    source_card_id TEXT NOT NULL,
    target_card_id TEXT NOT NULL,
    dependency_type TEXT NOT NULL CHECK(dependency_type IN ('blocks', 'blocked_by', 'related', 'duplicate', 'parent', 'child')),
    created_by TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER NOT NULL DEFAULT 0,
    board_id TEXT NOT NULL,
    metadata TEXT, -- JSON stored as TEXT

    -- Prevent duplicate active dependencies
    UNIQUE(source_card_id, target_card_id, dependency_type, deleted_at),

    -- Foreign key constraints
    FOREIGN KEY (source_card_id) REFERENCES blocks(id) ON DELETE CASCADE,
    FOREIGN KEY (target_card_id) REFERENCES blocks(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_card_deps_source
    ON card_dependencies(source_card_id, deleted_at)
    WHERE deleted_at = 0;

CREATE INDEX IF NOT EXISTS idx_card_deps_target
    ON card_dependencies(target_card_id, deleted_at)
    WHERE deleted_at = 0;

CREATE INDEX IF NOT EXISTS idx_card_deps_board
    ON card_dependencies(board_id, deleted_at)
    WHERE deleted_at = 0;

CREATE INDEX IF NOT EXISTS idx_card_deps_type
    ON card_dependencies(dependency_type, deleted_at)
    WHERE deleted_at = 0;

-- Composite index for finding inverse dependencies
CREATE INDEX IF NOT EXISTS idx_card_deps_inverse
    ON card_dependencies(target_card_id, source_card_id, dependency_type, deleted_at)
    WHERE deleted_at = 0;
