import {execSync} from 'child_process'
import {existsSync} from 'fs'
import {unlink} from 'fs/promises'

/**
 * Database helper utilities for E2E tests
 * Uses subprocess calls to Bun scripts to avoid Node ESM loader issues with bun:sqlite
 */

export async function resetTestDatabase() {
    console.log('🔄 Resetting test database...')

    try {
        // Run the seed script
        execSync('bun tests/e2e/seed-test-db.ts', {
            cwd: process.cwd(),
            stdio: 'pipe',
            env: {
                ...process.env,
                DB_CONFIG: 'focalboard-test.db?_busy_timeout=5000',
            },
        })

        console.log('✅ Test database reset complete')
    } catch (error) {
        console.error('❌ Failed to reset database:', error)
        throw error
    }
}

export async function clearTestDatabase() {
    console.log('🗑️  Clearing test database files...')

    const files = [
        'focalboard-test.db',
        'focalboard-test.db-shm',
        'focalboard-test.db-wal',
    ]

    for (const file of files) {
        try {
            if (existsSync(file)) {
                await unlink(file)
                console.log(`   ✓ Deleted ${file}`)
            }
        } catch (error) {
            console.log(`   ⚠️  Could not delete ${file}`)
        }
    }
}

/**
 * Clear a specific user's preferences
 */
export function clearUserPreferences(userId: string) {
    try {
        execSync(`bun tests/e2e/scripts/clear-preferences.ts "${userId}"`, {
            cwd: process.cwd(),
            stdio: 'pipe',
        })
    } catch (error) {
        console.error(`Failed to clear preferences for ${userId}:`, error)
        throw error
    }
}

/**
 * Set a user preference
 */
export function setUserPreference(userId: string, category: string, name: string, value: string) {
    try {
        execSync(`bun tests/e2e/scripts/set-preference.ts "${userId}" "${category}" "${name}" "${value}"`, {
            cwd: process.cwd(),
            stdio: 'pipe',
        })
    } catch (error) {
        console.error(`Failed to set preference for ${userId}:`, error)
        throw error
    }
}
