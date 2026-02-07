import { Hono } from "hono";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type * as schemaType from "../db/schema.ts";
import { boards } from "../db/schema.ts";
import { sessionRequired } from "../middleware/auth.ts";
import { eq, and } from "drizzle-orm";

const templateRoutes = new Hono();

// GET /teams/:teamID/templates
templateRoutes.get("/teams/:teamID/templates", sessionRequired, async (c) => {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const teamId = c.req.param("teamID");

  const templates = db
    .select()
    .from(boards)
    .where(
      and(
        eq(boards.teamId, teamId),
        eq(boards.isTemplate, true),
        eq(boards.deleteAt, 0),
      ),
    )
    .all();

  return c.json(templates);
});

export default templateRoutes;
