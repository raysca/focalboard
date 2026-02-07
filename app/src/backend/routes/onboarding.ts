import { Hono } from "hono";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type * as schemaType from "../db/schema.ts";
import { boards, boardMembers } from "../db/schema.ts";
import { sessionRequired } from "../middleware/auth.ts";

const onboardingRoutes = new Hono();

// POST /teams/:teamID/onboard
onboardingRoutes.post(
  "/teams/:teamID/onboard",
  sessionRequired,
  async (c) => {
    const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
    const teamId = c.req.param("teamID");
    const userId = c.get("userId") as string;
    const now = Date.now();
    const boardId = crypto.randomUUID();

    // Create a default welcome board
    db.insert(boards)
      .values({
        id: boardId,
        teamId,
        createdBy: userId,
        modifiedBy: userId,
        type: "O",
        title: "Welcome to Focalboard!",
        description: "Your first board.",
        createAt: now,
        updateAt: now,
        deleteAt: 0,
      })
      .run();

    db.insert(boardMembers)
      .values({
        boardId,
        userId,
        roles: "",
        minimumRole: "",
        schemeAdmin: true,
        schemeEditor: true,
        schemeCommenter: true,
        schemeViewer: true,
      })
      .run();

    return c.json({ teamID: teamId, boardID: boardId });
  },
);

export default onboardingRoutes;
