import {createApp} from "./backend/index.ts";
import {db} from "./backend/db/index.ts";
import {createAuth} from "./backend/auth/index.ts";
import {config} from "./backend/config.ts";

const auth = createAuth(db);
const app = createApp({db, auth});

// SPA fallback: serve frontend for non-API routes
app.get("*", (c) => {
  return new Response(Bun.file("./src/webapp/index.html"));
});

export default {
  fetch: app.fetch,
  port: config.port,
  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
};

console.log(`Server running on port ${config.port}`);
