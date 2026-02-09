import {createApp} from "./backend/index.ts";
import {db} from "./backend/db/index.ts";
import {createAuth} from "./backend/auth/index.ts";
import {config} from "./backend/config.ts";

const auth = createAuth(db);
const app = createApp({db, auth});

// Serve static files from dist
app.get("*", async (c) => {
  const path = c.req.path === "/" ? "/index.html" : c.req.path;
  const file = Bun.file(`./dist${path}`);
  if (await file.exists()) {
    return new Response(file);
  }
  return new Response(Bun.file("./dist/index.html"));
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
