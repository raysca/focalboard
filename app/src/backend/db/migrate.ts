import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { db } from "./index.ts";

export function runMigrations() {
    migrate(db, { migrationsFolder: "./src/backend/db/migrations" });
}

// Run migrations when this file is executed directly
if (import.meta.main) {
    console.log("Running migrations...");
    runMigrations();
    console.log("Migrations complete.");
}
