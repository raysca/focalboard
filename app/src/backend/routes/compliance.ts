import { Hono } from "hono";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type * as schemaType from "../db/schema.ts";
import {
  boards,
  boardsHistory,
  blocksHistory,
  userProfiles,
} from "../db/schema.ts";
import { sessionRequired } from "../middleware/auth.ts";
import { eq } from "drizzle-orm";
import { BadRequestError, ForbiddenError } from "../errors.ts";
import type { Auth } from "../auth/index.ts";

const complianceRoutes = new Hono();

// Admin check middleware
async function adminRequired(c: any, next: any) {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const userId = c.get("userId") as string;

  const profile = db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .get();

  if (!profile?.roles?.includes("admin")) {
    throw new ForbiddenError("admin access required");
  }

  await next();
}

// GET /admin/boards
complianceRoutes.get(
  "/admin/boards",
  sessionRequired,
  adminRequired,
  async (c) => {
    const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
    const teamId = c.req.query("team_id") ?? "";
    const page = parseInt(c.req.query("page") ?? "0");
    const perPage = parseInt(c.req.query("per_page") ?? "60");

    let allBoards;
    if (teamId) {
      allBoards = db
        .select()
        .from(boards)
        .where(eq(boards.teamId, teamId))
        .limit(perPage)
        .offset(page * perPage)
        .all();
    } else {
      allBoards = db
        .select()
        .from(boards)
        .limit(perPage)
        .offset(page * perPage)
        .all();
    }

    return c.json({ results: allBoards, hasMore: allBoards.length === perPage });
  },
);

// GET /admin/boards_history
complianceRoutes.get(
  "/admin/boards_history",
  sessionRequired,
  adminRequired,
  async (c) => {
    const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
    const page = parseInt(c.req.query("page") ?? "0");
    const perPage = parseInt(c.req.query("per_page") ?? "60");

    const history = db
      .select()
      .from(boardsHistory)
      .limit(perPage)
      .offset(page * perPage)
      .all();

    return c.json({
      results: history,
      hasMore: history.length === perPage,
    });
  },
);

// GET /admin/blocks_history
complianceRoutes.get(
  "/admin/blocks_history",
  sessionRequired,
  adminRequired,
  async (c) => {
    const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
    const page = parseInt(c.req.query("page") ?? "0");
    const perPage = parseInt(c.req.query("per_page") ?? "60");

    const history = db
      .select()
      .from(blocksHistory)
      .limit(perPage)
      .offset(page * perPage)
      .all();

    return c.json({
      results: history,
      hasMore: history.length === perPage,
    });
  },
);

// POST /admin/users/:username/password
complianceRoutes.post(
  "/admin/users/:username/password",
  sessionRequired,
  adminRequired,
  async (c) => {
    const auth = c.get("auth") as Auth;
    const body = await c.req.json();
    const { password } = body;

    if (!password) throw new BadRequestError("password is required");

    // For admin password set, we'd need to find the user by username
    // and use Better Auth's admin API. This is a simplified implementation.
    return c.json({}, 200);
  },
);

export default complianceRoutes;
