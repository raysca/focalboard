import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "./schema.ts";
import { config } from "../config.ts";

// Extract file path from dbconfig (strip query params like ?_busy_timeout=5000)
const dbPath = config.dbconfig.split("?")[0]!;

const sqlite = new Database(dbPath, { create: true });

// Enable WAL mode and set busy timeout
sqlite.exec("PRAGMA journal_mode = WAL;");
sqlite.exec("PRAGMA busy_timeout = 5000;");
sqlite.exec("PRAGMA foreign_keys = ON;");

export const db = drizzle(sqlite, { schema });

export { sqlite };
