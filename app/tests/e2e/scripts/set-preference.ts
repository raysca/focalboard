#!/usr/bin/env bun
/**
 * CLI script to set user preference in test database
 * Usage: bun tests/e2e/scripts/set-preference.ts <userId> <category> <name> <value>
 */

import {Database} from 'bun:sqlite'

const [userId, category, name, value] = process.argv.slice(2)

if (!userId || !category || !name || value === undefined) {
    console.error('Error: All parameters are required')
    console.error('Usage: bun set-preference.ts <userId> <category> <name> <value>')
    process.exit(1)
}

const db = new Database('focalboard-test.db')
try {
    db.run(
        'INSERT OR REPLACE INTO preferences (userid, category, name, value) VALUES (?, ?, ?, ?)',
        [userId, category, name, value]
    )
    console.log(`✓ Set preference for user ${userId}: ${category}.${name} = ${value}`)
    db.close()
} catch (error) {
    console.error('Error setting preference:', error)
    db.close()
    process.exit(1)
}
