import { Hono } from "hono";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type * as schemaType from "../db/schema.ts";
import { boards, boardMembers, blocks } from "../db/schema.ts";
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

    // Create default Kanban view
    const viewId = crypto.randomUUID();
    db.insert(blocks)
      .values({
        id: viewId,
        parentId: boardId,
        createdBy: userId,
        modifiedBy: userId,
        schema: 1,
        type: "board",
        title: "Board View",
        fields: {
          viewType: "board",
          sortOptions: [],
          visiblePropertyIds: [],
          visibleOptionIds: [],
          hiddenOptionIds: [],
          filter: {},
          cardOrder: [],
        },
        boardId,
        createAt: now,
        updateAt: now,
        deleteAt: 0,
      })
      .run();

    // Create sample cards
    const sampleCards = [
      {
        id: crypto.randomUUID(),
        title: "Getting Started",
        icon: "👋",
        description: "Welcome to Focalboard! This card shows you the basics. Click on it to see properties, comments, and description.",
      },
      {
        id: crypto.randomUUID(),
        title: "Explore Views",
        icon: "👁️",
        description: "Try different views! Click the 'Add View' button in the header to create Table, Gallery, or Calendar views of your cards.",
      },
      {
        id: crypto.randomUUID(),
        title: "Share & Collaborate",
        icon: "🤝",
        description: "Use the Share button to invite team members to this board. Work together in real-time!",
      },
    ];

    for (const card of sampleCards) {
      db.insert(blocks)
        .values({
          id: card.id,
          parentId: boardId,
          createdBy: userId,
          modifiedBy: userId,
          schema: 1,
          type: "card",
          title: card.title,
          fields: {
            icon: card.icon,
            properties: {},
            contentOrder: [],
          },
          boardId,
          createAt: now,
          updateAt: now,
          deleteAt: 0,
        })
        .run();
    }

    return c.json({ teamID: teamId, boardID: boardId });
  },
);

export default onboardingRoutes;
