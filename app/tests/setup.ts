import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import * as schema from "../src/backend/db/schema.ts";
import { createAuth } from "../src/backend/auth/index.ts";
import { createApp } from "../src/backend/index.ts";
import type { Hono } from "hono";

export function createTestApp() {
  const sqlite = new Database(":memory:");
  sqlite.exec("PRAGMA journal_mode = WAL;");
  sqlite.exec("PRAGMA foreign_keys = ON;");

  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: "./src/backend/db/migrations" });

  const auth = createAuth(db);
  const app = createApp({ db, auth });

  return { app, db, sqlite, auth };
}

export function testRequest(
  app: Hono,
  path: string,
  options: RequestInit = {},
) {
  const headers = new Headers(options.headers);
  if (!headers.has("X-Requested-With")) {
    headers.set("X-Requested-With", "XMLHttpRequest");
  }
  return app.request(path, { ...options, headers });
}
