import { Hono } from "hono";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type * as schema from "./db/schema.ts";
import type { Auth } from "./auth/index.ts";
import { onError } from "./middleware/error.ts";
import { csrfCheck } from "./middleware/csrf.ts";
import apiRoutes from "./routes/index.ts";
import websocketRoutes from "./routes/websocket.ts";
import { createEventService } from "./services/event.service.ts";
import { createRealtimeService } from "./services/realtime.service.ts";
import { createBlockService } from "./services/block.ts";

export interface AppDeps {
  db: BunSQLiteDatabase<typeof schema>;
  auth: Auth;
}

export function createApp(deps: AppDeps) {
  const app = new Hono();

  // Initialize services
  const eventService = createEventService();
  const realtimeService = createRealtimeService(deps.db, eventService);
  const blockService = createBlockService(deps.db, eventService);

  // Wire EventService to RealtimeService for broadcasting
  eventService.setBroadcastHandler((event) => {
    realtimeService.broadcast(event);
  });

  // Global error handler
  app.onError(onError);

  // Inject dependencies into context for all routes
  app.use("*", async (c, next) => {
    c.set("db", deps.db);
    c.set("auth", deps.auth);
    c.set("eventService", eventService);
    c.set("realtimeService", realtimeService);
    c.set("blockService", blockService);
    await next();
  });

  // CSRF check on all API v2 routes (except WebSocket)
  app.use("/api/v2/*", async (c, next) => {
    // Skip CSRF check for WebSocket upgrade
    if (c.req.path === "/api/v2/ws") {
      await next();
      return;
    }
    await csrfCheck(c, next);
  });

  // Mount API v2 routes
  app.route("/api/v2", apiRoutes);

  // Mount WebSocket route
  app.route("/api/v2", websocketRoutes);

  return app;
}
