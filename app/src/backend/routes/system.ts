import { Hono } from "hono";
import { config } from "../config.ts";

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
  return c.json({
    telemetry: config.telemetry,
    enablePublicSharedBoards: config.enablePublicSharedBoards,
  });
});

export default system;
