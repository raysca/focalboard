import { exec } from 'child_process'
import { promisify } from 'util'
import { unlink } from 'fs/promises'
import { existsSync } from 'fs'

const execAsync = promisify(exec)

export default async function globalSetup() {
    console.log('\n🧪 Setting up test environment...\n')

    // Set environment variable for test database
    process.env.DB_CONFIG = 'focalboard-test.db?_busy_timeout=5000'

    // Remove existing test database
    const testDb = 'focalboard-test.db'
    const testDbShm = 'focalboard-test.db-shm'
    const testDbWal = 'focalboard-test.db-wal'

    try {
        if (existsSync(testDb)) await unlink(testDb)
        if (existsSync(testDbShm)) await unlink(testDbShm)
        if (existsSync(testDbWal)) await unlink(testDbWal)
        console.log('✅ Cleaned up old test database')
    } catch (error) {
        console.log('⚠️  No existing test database to clean')
    }

    // Run migrations and seed with proper database closing
    console.log('🔄 Running migrations and seeding test database...')
    try {
        // Run dedicated test seed script that properly closes database
        await execAsync('bun tests/e2e/seed-test-db.ts', {
            cwd: process.cwd(),
        })
        console.log('')
    } catch (error) {
        console.error('❌ Failed to seed test database:', error)
        throw error
    }
}
