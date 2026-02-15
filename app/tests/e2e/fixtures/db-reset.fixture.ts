import {test as base} from '@playwright/test'
import {resetTestDatabase} from '../helpers/db-helpers'

/**
 * Database reset fixture
 * Resets the database to a clean state before each test
 */
export const test = base.extend({
    // Reset database before each test
    resetDatabase: [async ({}, use) => {
        console.log('  🔄 Resetting database for test...')

        try {
            await resetTestDatabase()
            console.log('  ✅ Database reset complete')
        } catch (error) {
            console.error('  ❌ Failed to reset database:', error)
            throw error
        }

        // Proceed with the test
        await use()
    }, {auto: true}], // auto: true means this runs automatically before each test
})

export {expect} from '@playwright/test'
