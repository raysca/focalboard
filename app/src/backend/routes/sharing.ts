import { Hono } from "hono";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type * as schemaType from "../db/schema.ts";
import { sharing } from "../db/schema.ts";
import { sessionRequired } from "../middleware/auth.ts";
import { eq } from "drizzle-orm";

const sharingRoutes = new Hono();

// GET /boards/:boardID/sharing
sharingRoutes.get("/boards/:boardID/sharing", sessionRequired, async (c) => {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const boardId = c.req.param("boardID");

  const shareInfo = db
    .select()
    .from(sharing)
    .where(eq(sharing.id, boardId))
    .get();

  if (!shareInfo) {
    return c.json({ id: boardId, enabled: false, token: "" });
  }

  return c.json(shareInfo);
});

// POST /boards/:boardID/sharing
sharingRoutes.post("/boards/:boardID/sharing", sessionRequired, async (c) => {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const boardId = c.req.param("boardID");
  const userId = c.get("userId") as string;
  const body = await c.req.json();
  const now = Date.now();

  const existing = db
    .select()
    .from(sharing)
    .where(eq(sharing.id, boardId))
    .get();

  const token = body.token || crypto.randomUUID();

  if (existing) {
    db.update(sharing)
      .set({
        enabled: body.enabled ?? false,
        token,
        modifiedBy: userId,
        updateAt: now,
      })
      .where(eq(sharing.id, boardId))
      .run();
  } else {
    db.insert(sharing)
      .values({
        id: boardId,
        enabled: body.enabled ?? false,
        token,
        modifiedBy: userId,
        updateAt: now,
      })
      .run();
  }

  const updated = db
    .select()
    .from(sharing)
    .where(eq(sharing.id, boardId))
    .get();

  return c.json(updated);
});

export default sharingRoutes;
