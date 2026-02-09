import { Hono } from "hono";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type * as schemaType from "../db/schema.ts";
import { blocks } from "../db/schema.ts";
import { sessionRequired } from "../middleware/auth.ts";
import { eq, and } from "drizzle-orm";
import { BadRequestError, NotFoundError } from "../errors.ts";
import { recordBlockHistory } from "../services/history.ts";
import type { BlockService } from "../services/block.ts";

const blockRoutes = new Hono();

// GET /boards/:boardID/blocks
blockRoutes.get("/boards/:boardID/blocks", sessionRequired, async (c) => {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const boardId = c.req.param("boardID");
  const parentId = c.req.query("parent_id");
  const type = c.req.query("type");

  let conditions = [eq(blocks.boardId, boardId), eq(blocks.deleteAt, 0)];
  if (parentId) conditions.push(eq(blocks.parentId, parentId));
  if (type) conditions.push(eq(blocks.type, type));

  const result = db
    .select()
    .from(blocks)
    .where(and(...conditions))
    .all();

  return c.json(result);
});

// POST /boards/:boardID/blocks
blockRoutes.post("/boards/:boardID/blocks", sessionRequired, async (c) => {
  const blockService = c.get("blockService") as BlockService;
  const boardId = c.req.param("boardID");
  const userId = c.get("userId") as string;
  const body = await c.req.json();

  const items = Array.isArray(body) ? body : [body];
  const createdBlocks = [];

  for (const item of items) {
    // Use BlockService.create() which publishes BLOCK_CREATED or COMMENT_CREATED events
    const block = await blockService.create(userId, boardId, {
      id: item.id || crypto.randomUUID(),
      parentId: item.parentId ?? "",
      schema: item.schema ?? 0,
      type: item.type ?? "",
      title: item.title ?? "",
      fields: item.fields ?? {},
    });
    createdBlocks.push(block);
  }

  return c.json(createdBlocks);
});

// PATCH /boards/:boardID/blocks
blockRoutes.patch("/boards/:boardID/blocks", sessionRequired, async (c) => {
  const blockService = c.get("blockService") as BlockService;
  const userId = c.get("userId") as string;
  const body = await c.req.json();

  const items = Array.isArray(body) ? body : [body];
  const updatedBlocks = [];

  for (const item of items) {
    if (!item.id) continue;

    // Build update object with only provided fields
    const updates: Record<string, unknown> = {};
    if (item.title !== undefined) updates.title = item.title;
    if (item.fields !== undefined) updates.fields = item.fields;
    if (item.parentId !== undefined) updates.parentId = item.parentId;
    if (item.type !== undefined) updates.type = item.type;
    if (item.schema !== undefined) updates.schema = item.schema;

    // Use BlockService.update() which publishes BLOCK_UPDATED or COMMENT_UPDATED events
    const updated = await blockService.update(userId, item.id, updates);
    updatedBlocks.push(updated);
  }

  return c.json(updatedBlocks);
});

// DELETE /boards/:boardID/blocks/:blockID
blockRoutes.delete(
  "/boards/:boardID/blocks/:blockID",
  sessionRequired,
  async (c) => {
    const blockService = c.get("blockService") as BlockService;
    const blockId = c.req.param("blockID");
    const userId = c.get("userId") as string;

    // Use BlockService.delete() which publishes BLOCK_DELETED or COMMENT_DELETED events
    await blockService.delete(userId, blockId);

    return c.json({}, 200);
  },
);

// PATCH /boards/:boardID/blocks/:blockID
blockRoutes.patch(
  "/boards/:boardID/blocks/:blockID",
  sessionRequired,
  async (c) => {
    const blockService = c.get("blockService") as BlockService;
    const blockId = c.req.param("blockID");
    const userId = c.get("userId") as string;
    const body = await c.req.json();

    // Build update object with only provided fields
    const updates: Record<string, unknown> = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.fields !== undefined) updates.fields = body.fields;
    if (body.parentId !== undefined) updates.parentId = body.parentId;
    if (body.type !== undefined) updates.type = body.type;
    if (body.schema !== undefined) updates.schema = body.schema;

    // Use BlockService.update() which publishes BLOCK_UPDATED or COMMENT_UPDATED events
    const updated = await blockService.update(userId, blockId, updates);

    return c.json(updated);
  },
);

// POST /boards/:boardID/blocks/:blockID/undelete
blockRoutes.post(
  "/boards/:boardID/blocks/:blockID/undelete",
  sessionRequired,
  async (c) => {
    const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
    const blockId = c.req.param("blockID");
    const userId = c.get("userId") as string;

    db.update(blocks)
      .set({ deleteAt: 0, modifiedBy: userId, updateAt: Date.now() })
      .where(eq(blocks.id, blockId))
      .run();

    const block = db.select().from(blocks).where(eq(blocks.id, blockId)).get();
    if (!block) throw new NotFoundError("block not found");

    return c.json(block);
  },
);

// POST /boards/:boardID/blocks/:blockID/duplicate
blockRoutes.post(
  "/boards/:boardID/blocks/:blockID/duplicate",
  sessionRequired,
  async (c) => {
    const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
    const blockId = c.req.param("blockID");
    const boardId = c.req.param("boardID");
    const userId = c.get("userId") as string;
    const now = Date.now();

    const original = db
      .select()
      .from(blocks)
      .where(eq(blocks.id, blockId))
      .get();

    if (!original) throw new NotFoundError("block not found");

    const newBlock = {
      ...original,
      id: crypto.randomUUID(),
      createdBy: userId,
      modifiedBy: userId,
      createAt: now,
      updateAt: now,
      deleteAt: 0,
    };

    db.insert(blocks).values(newBlock).run();

    // Duplicate child blocks
    const children = db
      .select()
      .from(blocks)
      .where(and(eq(blocks.parentId, blockId), eq(blocks.deleteAt, 0)))
      .all();

    for (const child of children) {
      db.insert(blocks)
        .values({
          ...child,
          id: crypto.randomUUID(),
          parentId: newBlock.id,
          createdBy: userId,
          modifiedBy: userId,
          createAt: now,
          updateAt: now,
        })
        .run();
    }

    return c.json(newBlock);
  },
);

export default blockRoutes;
