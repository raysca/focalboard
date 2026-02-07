import { Hono } from "hono";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type * as schemaType from "../db/schema.ts";
import { boards, blocks } from "../db/schema.ts";
import { sessionRequired } from "../middleware/auth.ts";
import { eq, and } from "drizzle-orm";
import { NotFoundError } from "../errors.ts";

const archiveRoutes = new Hono();

// GET /boards/:boardID/archive/export
archiveRoutes.get(
  "/boards/:boardID/archive/export",
  sessionRequired,
  async (c) => {
    const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
    const boardId = c.req.param("boardID");

    const board = db.select().from(boards).where(eq(boards.id, boardId)).get();
    if (!board) throw new NotFoundError("board not found");

    const boardBlocks = db
      .select()
      .from(blocks)
      .where(and(eq(blocks.boardId, boardId), eq(blocks.deleteAt, 0)))
      .all();

    const archive = {
      version: 2,
      date: Date.now(),
      boards: [board],
      blocks: boardBlocks,
    };

    return c.json(archive);
  },
);

// GET /teams/:teamID/archive/export
archiveRoutes.get(
  "/teams/:teamID/archive/export",
  sessionRequired,
  async (c) => {
    const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
    const teamId = c.req.param("teamID");

    const teamBoards = db
      .select()
      .from(boards)
      .where(and(eq(boards.teamId, teamId), eq(boards.deleteAt, 0)))
      .all();

    const allBlocks: (typeof blocks.$inferSelect)[] = [];
    for (const board of teamBoards) {
      const boardBlocks = db
        .select()
        .from(blocks)
        .where(and(eq(blocks.boardId, board.id), eq(blocks.deleteAt, 0)))
        .all();
      allBlocks.push(...boardBlocks);
    }

    const archive = {
      version: 2,
      date: Date.now(),
      boards: teamBoards,
      blocks: allBlocks,
    };

    return c.json(archive);
  },
);

// POST /teams/:teamID/archive/import
archiveRoutes.post(
  "/teams/:teamID/archive/import",
  sessionRequired,
  async (c) => {
    const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
    const teamId = c.req.param("teamID");
    const userId = c.get("userId") as string;
    const now = Date.now();

    const body = await c.req.json();
    const importBoards = body.boards ?? [];
    const importBlocks = body.blocks ?? [];

    for (const board of importBoards) {
      db.insert(boards)
        .values({
          ...board,
          id: board.id || crypto.randomUUID(),
          teamId,
          createdBy: userId,
          modifiedBy: userId,
          createAt: now,
          updateAt: now,
          deleteAt: 0,
        })
        .run();
    }

    for (const block of importBlocks) {
      db.insert(blocks)
        .values({
          ...block,
          id: block.id || crypto.randomUUID(),
          createdBy: userId,
          modifiedBy: userId,
          createAt: now,
          updateAt: now,
          deleteAt: 0,
        })
        .run();
    }

    return c.json({}, 200);
  },
);

export default archiveRoutes;
