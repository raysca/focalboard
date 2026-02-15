import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export default async function globalSetup() {
    console.log('\n🧪 Setting up test environment...\n')

    // Set environment variable for in-memory test database
    process.env.NODE_ENV = 'test'

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
