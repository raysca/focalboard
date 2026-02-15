import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "./schema.ts";
import { config } from "../config.ts";

// Detect test environment
const isTest = process.env.NODE_ENV === 'test'

// Use in-memory database for tests, file-based for production/development
const dbPath = isTest ? ':memory:' : config.dbconfig.split("?")[0]!;

// Log database mode for debugging
console.log(`[DB] Using ${isTest ? 'in-memory' : 'file-based'} database: ${dbPath}`)

const sqlite = new Database(dbPath, { create: true });

// Use DELETE journal mode for in-memory/test databases, WAL for production
// WAL mode is not applicable to in-memory databases
const isMemoryOrTestDb = dbPath === ':memory:' || dbPath.includes('test.db')
const journalMode = isMemoryOrTestDb ? 'DELETE' : 'WAL'

sqlite.exec(`PRAGMA journal_mode = ${journalMode};`);
sqlite.exec("PRAGMA busy_timeout = 10000;");
sqlite.exec("PRAGMA foreign_keys = ON;");

export const db = drizzle(sqlite, { schema });

export { sqlite };
