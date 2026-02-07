import { Hono } from "hono";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type * as schemaType from "../db/schema.ts";
import { boards, boardMembers } from "../db/schema.ts";
import { sessionRequired } from "../middleware/auth.ts";
import { eq, and, like, inArray } from "drizzle-orm";
import { BadRequestError } from "../errors.ts";

const searchRoutes = new Hono();

// GET /boards/search
searchRoutes.get("/boards/search", sessionRequired, async (c) => {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const userId = c.get("userId") as string;
  const q = c.req.query("q") ?? "";

  if (!q) throw new BadRequestError("search term is required");

  const memberBoards = db
    .select({ boardId: boardMembers.boardId })
    .from(boardMembers)
    .where(eq(boardMembers.userId, userId))
    .all();

  const memberBoardIds = memberBoards.map((m) => m.boardId);
  if (memberBoardIds.length === 0) return c.json([]);

  const results = db
    .select()
    .from(boards)
    .where(
      and(
        like(boards.title, `%${q}%`),
        eq(boards.deleteAt, 0),
        inArray(boards.id, memberBoardIds),
      ),
    )
    .all();

  return c.json(results);
});

// GET /teams/:teamID/boards/search
searchRoutes.get(
  "/teams/:teamID/boards/search",
  sessionRequired,
  async (c) => {
    const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
    const teamId = c.req.param("teamID");
    const userId = c.get("userId") as string;
    const q = c.req.query("q") ?? "";

    if (!q) throw new BadRequestError("search term is required");

    const memberBoards = db
      .select({ boardId: boardMembers.boardId })
      .from(boardMembers)
      .where(eq(boardMembers.userId, userId))
      .all();

    const memberBoardIds = memberBoards.map((m) => m.boardId);
    if (memberBoardIds.length === 0) return c.json([]);

    const results = db
      .select()
      .from(boards)
      .where(
        and(
          like(boards.title, `%${q}%`),
          eq(boards.teamId, teamId),
          eq(boards.deleteAt, 0),
          inArray(boards.id, memberBoardIds),
        ),
      )
      .all();

    return c.json(results);
  },
);

// GET /teams/:teamID/boards/search/linkable
searchRoutes.get(
  "/teams/:teamID/boards/search/linkable",
  sessionRequired,
  async (c) => {
    const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
    const teamId = c.req.param("teamID");
    const q = c.req.query("q") ?? "";

    if (!q) throw new BadRequestError("search term is required");

    // Linkable boards = all non-deleted boards in the team
    const results = db
      .select()
      .from(boards)
      .where(
        and(
          like(boards.title, `%${q}%`),
          eq(boards.teamId, teamId),
          eq(boards.deleteAt, 0),
          eq(boards.isTemplate, false),
        ),
      )
      .all();

    return c.json(results);
  },
);

// GET /teams/:teamID/channels (stub for standalone)
searchRoutes.get("/teams/:teamID/channels", sessionRequired, async (c) => {
  return c.json([]);
});

// GET /teams/:teamID/channels/:channelID (stub for standalone)
searchRoutes.get(
  "/teams/:teamID/channels/:channelID",
  sessionRequired,
  async (c) => {
    return c.json({});
  },
);

export default searchRoutes;
