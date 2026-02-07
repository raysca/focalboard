import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/backend/db/schema.ts",
  out: "./src/backend/db/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DB_CONFIG?.split("?")[0] ?? "./focalboard.db",
  },
});
