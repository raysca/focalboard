import { Hono } from "hono";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type * as schemaType from "../db/schema.ts";
import { boards, blocks } from "../db/schema.ts";
import { sessionRequired } from "../middleware/auth.ts";
import { eq, and } from "drizzle-orm";

const statisticsRoutes = new Hono();

// GET /statistics
statisticsRoutes.get("/statistics", sessionRequired, async (c) => {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;

  const boardCount = db
    .select()
    .from(boards)
    .where(eq(boards.deleteAt, 0))
    .all().length;

  const cardCount = db
    .select()
    .from(blocks)
    .where(and(eq(blocks.type, "card"), eq(blocks.deleteAt, 0)))
    .all().length;

  return c.json({ board_count: boardCount, card_count: cardCount });
});

export default statisticsRoutes;
