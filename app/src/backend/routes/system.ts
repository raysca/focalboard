import { Hono } from "hono";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type * as schemaType from "../db/schema.ts";
import { config } from "../config.ts";
import { AdminSettingsService } from "../services/admin-settings.service.ts";

const system = new Hono();

system.get("/hello", (c) => {
  return c.json({ message: "Focalboard API" });
});

system.get("/ping", (c) => {
  return c.json({
    status: "ok",
    serverTime: Date.now(),
    serverVersion: "0.1.0",
  });
});

system.get("/clientConfig", (c) => {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;

  // Get public settings from admin settings
  const settingsService = new AdminSettingsService(db);
  const publicSettings = settingsService.getSettingsByCategory(undefined, true);

  // Convert settings array to key-value object
  const settingsObj = publicSettings.reduce((acc, setting) => {
    acc[setting.id] = setting.value;
    return acc;
  }, {} as Record<string, unknown>);

  return c.json({
    telemetry: config.telemetry,
    enablePublicSharedBoards: config.enablePublicSharedBoards,
    ...settingsObj, // Expose public settings to frontend
  });
});

export default system;
