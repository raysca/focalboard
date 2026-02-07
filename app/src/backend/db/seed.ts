/**
 * Database seed script
 * Creates the default team and any other baseline data needed.
 *
 * Usage: bun src/backend/db/seed.ts
 */

import { migrate } from 'drizzle-orm/bun-sqlite/migrator'
import {db} from './index.ts'
import {teams} from './schema.ts'

// Run migrations first
migrate(db, { migrationsFolder: './src/backend/db/migrations' })

// Insert default team (ID "0") if it doesn't exist
const existingTeam = db.select().from(teams).get()
if (!existingTeam) {
    db.insert(teams).values({
        id: '0',
        title: 'Default',
        signupToken: '',
        settings: {},
        modifiedBy: 'system',
        updateAt: Date.now(),
    }).run()
    console.log('Created default team (id: 0)')
} else {
    console.log('Default team already exists')
}

console.log('Seed complete')
