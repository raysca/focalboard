#!/usr/bin/env bun
/**
 * Seed test database and properly close connections
 * This ensures the database is fully written and can be accessed by the dev server
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { Database } from 'bun:sqlite'

const execAsync = promisify(exec)

// Run the seed script
console.log('🔄 Running seed script...')
await execAsync('bun src/backend/db/seed.ts --force', {
    cwd: process.cwd(),
    env: {
        ...process.env,
        DB_CONFIG: 'focalboard-test.db?_busy_timeout=5000',
    },
})

// Open the database and run a checkpoint to flush WAL
console.log('💾 Flushing database WAL...')
const db = new Database('focalboard-test.db')
db.run('PRAGMA wal_checkpoint(TRUNCATE)')
db.close()

console.log('✅ Test database ready!')
