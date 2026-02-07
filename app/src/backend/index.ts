import { Hono } from "hono";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type * as schema from "./db/schema.ts";
import type { Auth } from "./auth/index.ts";
import { onError } from "./middleware/error.ts";
import { csrfCheck } from "./middleware/csrf.ts";
import apiRoutes from "./routes/index.ts";

export interface AppDeps {
  db: BunSQLiteDatabase<typeof schema>;
  auth: Auth;
}

export function createApp(deps: AppDeps) {
  const app = new Hono();

  // Global error handler
  app.onError(onError);

  // Inject db and auth into context for all routes
  app.use("*", async (c, next) => {
    c.set("db", deps.db);
    c.set("auth", deps.auth);
    await next();
  });

  // CSRF check on all API v2 routes
  app.use("/api/v2/*", csrfCheck);

  // Mount API v2 routes
  app.route("/api/v2", apiRoutes);

  return app;
}
