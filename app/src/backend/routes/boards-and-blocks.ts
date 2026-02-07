import { Hono } from "hono";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type * as schemaType from "../db/schema.ts";
import { boards, blocks, boardMembers } from "../db/schema.ts";
import { sessionRequired } from "../middleware/auth.ts";
import { eq } from "drizzle-orm";
import { BadRequestError } from "../errors.ts";

const boardsAndBlocksRoutes = new Hono();

// POST /boards-and-blocks
boardsAndBlocksRoutes.post(
  "/boards-and-blocks",
  sessionRequired,
  async (c) => {
    const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
    const userId = c.get("userId") as string;
    const body = await c.req.json();
    const now = Date.now();

    const newBoards = body.boards ?? [];
    const newBlocks = body.blocks ?? [];

    // Insert boards
    for (const board of newBoards) {
      const id = board.id || crypto.randomUUID();
      db.insert(boards)
        .values({
          id,
          teamId: board.teamId ?? "",
          channelId: board.channelId ?? "",
          createdBy: userId,
          modifiedBy: userId,
          type: board.type ?? "O",
          minimumRole: board.minimumRole ?? "",
          title: board.title ?? "",
          description: board.description ?? "",
          icon: board.icon ?? "",
          showDescription: board.showDescription ?? false,
          isTemplate: board.isTemplate ?? false,
          templateVersion: board.templateVersion ?? 0,
          properties: board.properties ?? {},
          cardProperties: board.cardProperties ?? [],
          createAt: now,
          updateAt: now,
          deleteAt: 0,
        })
        .run();

      // Add creator as admin
      db.insert(boardMembers)
        .values({
          boardId: id,
          userId,
          roles: "",
          minimumRole: "",
          schemeAdmin: true,
          schemeEditor: true,
          schemeCommenter: true,
          schemeViewer: true,
        })
        .run();

      board.id = id;
    }

    // Insert blocks
    for (const block of newBlocks) {
      const id = block.id || crypto.randomUUID();
      db.insert(blocks)
        .values({
          id,
          parentId: block.parentId ?? "",
          createdBy: userId,
          modifiedBy: userId,
          schema: block.schema ?? 0,
          type: block.type ?? "",
          title: block.title ?? "",
          fields: block.fields ?? {},
          boardId: block.boardId ?? "",
          createAt: now,
          updateAt: now,
          deleteAt: 0,
        })
        .run();
      block.id = id;
    }

    return c.json({ boards: newBoards, blocks: newBlocks });
  },
);

// PATCH /boards-and-blocks
boardsAndBlocksRoutes.patch(
  "/boards-and-blocks",
  sessionRequired,
  async (c) => {
    const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
    const userId = c.get("userId") as string;
    const body = await c.req.json();
    const now = Date.now();

    const boardPatches = body.boards ?? [];
    const blockPatches = body.blocks ?? [];

    for (const patch of boardPatches) {
      if (!patch.id) continue;
      const updates: Record<string, unknown> = {
        modifiedBy: userId,
        updateAt: now,
      };
      if (patch.title !== undefined) updates.title = patch.title;
      if (patch.description !== undefined) updates.description = patch.description;
      if (patch.icon !== undefined) updates.icon = patch.icon;
      if (patch.type !== undefined) updates.type = patch.type;
      if (patch.properties !== undefined) updates.properties = patch.properties;
      if (patch.cardProperties !== undefined)
        updates.cardProperties = patch.cardProperties;

      db.update(boards).set(updates).where(eq(boards.id, patch.id)).run();
    }

    for (const patch of blockPatches) {
      if (!patch.id) continue;
      const updates: Record<string, unknown> = {
        modifiedBy: userId,
        updateAt: now,
      };
      if (patch.title !== undefined) updates.title = patch.title;
      if (patch.fields !== undefined) updates.fields = patch.fields;
      if (patch.parentId !== undefined) updates.parentId = patch.parentId;

      db.update(blocks).set(updates).where(eq(blocks.id, patch.id)).run();
    }

    return c.json({}, 200);
  },
);

// DELETE /boards-and-blocks
boardsAndBlocksRoutes.delete(
  "/boards-and-blocks",
  sessionRequired,
  async (c) => {
    const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
    const userId = c.get("userId") as string;
    const body = await c.req.json();
    const now = Date.now();

    const boardIds: string[] = body.boards ?? [];
    const blockIds: string[] = body.blocks ?? [];

    for (const id of boardIds) {
      db.update(boards)
        .set({ deleteAt: now, modifiedBy: userId })
        .where(eq(boards.id, id))
        .run();
    }

    for (const id of blockIds) {
      db.update(blocks)
        .set({ deleteAt: now, modifiedBy: userId })
        .where(eq(blocks.id, id))
        .run();
    }

    return c.json({}, 200);
  },
);

export default boardsAndBlocksRoutes;
