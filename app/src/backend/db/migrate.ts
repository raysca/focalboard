import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { db } from "./index.ts";

console.log("Running migrations...");
migrate(db, { migrationsFolder: "./src/backend/db/migrations" });
console.log("Migrations complete.");
