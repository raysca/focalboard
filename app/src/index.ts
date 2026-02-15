import {createApp} from "./backend/index.ts";
import {db} from "./backend/db/index.ts";
import {createAuth} from "./backend/auth/index.ts";
import {config} from "./backend/config.ts";
import {runMigrations} from "./backend/db/migrate.ts";

// Run migrations on startup in test mode (in-memory DB needs setup each time)
if (process.env.NODE_ENV === 'test') {
    console.log('[Test Mode] Running migrations...')
    await runMigrations()
    console.log('[Test Mode] Migrations complete')

    // Import and run seed dynamically to avoid circular dependencies
    const {seedDatabase} = await import('./backend/db/seed.ts')
    console.log('[Test Mode] Seeding database...')
    await seedDatabase(true) // force = true
    console.log('[Test Mode] Database ready')
}

const auth = createAuth(db);
const app = createApp({db, auth});

// Serve static files from dist
app.get("*", async (c) => {
  const path = c.req.path === "/" ? "/index.html" : c.req.path;
  const file = Bun.file(`./dist${path}`);
  if (await file.exists()) {
    return new Response(file);
  }
  // Only serve index.html for non-API routes
  if (!c.req.path.startsWith("/api/")) {
    return new Response(Bun.file("./dist/index.html"));
  }
  return c.notFound();
});

export default {
  fetch: app.fetch,
  port: config.port,
  // Enable WebSocket support for Bun
  websocket: {
    message() {}, // Handled by Hono upgradeWebSocket
    open() {},    // Handled by Hono upgradeWebSocket
    close() {},   // Handled by Hono upgradeWebSocket
    drain() {},   // Handled by Hono upgradeWebSocket
  },
  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
};

console.log(`Server running on port ${config.port}`);
