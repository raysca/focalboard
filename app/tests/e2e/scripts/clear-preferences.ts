#!/usr/bin/env bun
/**
 * CLI script to clear user preferences in test database
 * Usage: bun tests/e2e/scripts/clear-preferences.ts <userId>
 */

import {Database} from 'bun:sqlite'

const userId = process.argv[2]

if (!userId) {
    console.error('Error: userId is required')
    console.error('Usage: bun clear-preferences.ts <userId>')
    process.exit(1)
}

const db = new Database('focalboard-test.db')
try {
    db.run('DELETE FROM preferences WHERE userid = ?', [userId])
    console.log(`✓ Cleared preferences for user: ${userId}`)
    db.close()
} catch (error) {
    console.error('Error clearing preferences:', error)
    db.close()
    process.exit(1)
}
