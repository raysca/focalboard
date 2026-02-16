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

    // Validate teamID parameter
    if (!teamId) {
      return c.json({ error: 'Team ID is required' }, 400);
    }

    const userId = c.get("userId") as string;
    const now = Date.now();
    const boardId = crypto.randomUUID();

    // Define property IDs and option IDs
    const statusPropId = 'prop-status'
    const priorityPropId = 'prop-priority'

    const statusTodoId = 'status-todo'
    const statusInProgressId = 'status-in-progress'
    const statusDoneId = 'status-done'

    const priorityLowId = 'priority-low'
    const priorityMediumId = 'priority-medium'
    const priorityHighId = 'priority-high'

    // Create card properties (Status and Priority)
    const cardProperties = [
      {
        id: statusPropId,
        name: 'Status',
        type: 'select',
        options: [
          {id: statusTodoId, value: 'To Do', color: 'default'},
          {id: statusInProgressId, value: 'In Progress', color: 'yellow'},
          {id: statusDoneId, value: 'Done', color: 'green'}
        ]
      },
      {
        id: priorityPropId,
        name: 'Priority',
        type: 'select',
        options: [
          {id: priorityLowId, value: 'Low', color: 'blue'},
          {id: priorityMediumId, value: 'Medium', color: 'yellow'},
          {id: priorityHighId, value: 'High', color: 'red'}
        ]
      }
    ]

    // Create the welcome board with properties
    const viewId = crypto.randomUUID()

    try {
      db.transaction((tx) => {
        tx.insert(boards)
          .values({
            id: boardId,
            teamId,
            createdBy: userId,
            modifiedBy: userId,
            type: "O",
            title: "Welcome to Focalboard!",
            cardProperties,
            createAt: now,
            updateAt: now,
            deleteAt: 0,
          })
          .run();

        tx.insert(boardMembers)
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

        // Create board view with single "Getting Started" group (ungrouped)
        tx.insert(blocks)
          .values({
            id: viewId,
            boardId,
            parentId: boardId,
            createdBy: userId,
            modifiedBy: userId,
            type: 'view',
            title: 'Board View',
            schema: 1,
            fields: {
              viewType: 'board',
              groupById: '',
              visiblePropertyIds: [statusPropId, priorityPropId],
            },
            createAt: now,
            updateAt: now,
            deleteAt: 0,
          })
          .run();

        // Create 3 sample cards with rich descriptions
        const card1Id = crypto.randomUUID()
        const card2Id = crypto.randomUUID()
        const card3Id = crypto.randomUUID()

        const card1TextId = crypto.randomUUID()
        const card2TextId = crypto.randomUUID()
        const card3TextId = crypto.randomUUID()

        // Card 1: Getting Started
        tx.insert(blocks)
          .values({
            id: card1Id,
            boardId,
            parentId: boardId,
            createdBy: userId,
            modifiedBy: userId,
            type: 'card',
            title: 'Getting Started',
            schema: 1,
            fields: {
              properties: {
                [statusPropId]: statusTodoId,
                [priorityPropId]: priorityHighId
              },
              contentOrder: [card1TextId],
            },
            createAt: now,
            updateAt: now,
            deleteAt: 0,
          })
          .run();

        tx.insert(blocks)
          .values({
            id: card1TextId,
            boardId,
            parentId: card1Id,
            createdBy: userId,
            modifiedBy: userId,
            type: 'text',
            title: 'Welcome to Focalboard! Click this card to open it and see how cards work. You can add descriptions, checklists, comments, and more. Try editing this card to customize it.',
            schema: 1,
            fields: {},
            createAt: now,
            updateAt: now,
            deleteAt: 0,
          })
          .run();

        // Card 2: Explore Views
        tx.insert(blocks)
          .values({
            id: card2Id,
            boardId,
            parentId: boardId,
            createdBy: userId,
            modifiedBy: userId,
            type: 'card',
            title: 'Explore Views',
            schema: 1,
            fields: {
              properties: {
                [statusPropId]: statusInProgressId,
                [priorityPropId]: priorityMediumId
              },
              contentOrder: [card2TextId],
            },
            createAt: now,
            updateAt: now,
            deleteAt: 0,
          })
          .run();

        tx.insert(blocks)
          .values({
            id: card2TextId,
            boardId,
            parentId: card2Id,
            createdBy: userId,
            modifiedBy: userId,
            type: 'text',
            title: 'Focalboard supports multiple view types: Board view (kanban), Table view (spreadsheet), Gallery view (cards), and Calendar view (timeline). Switch between views using the tabs at the top of your board.',
            schema: 1,
            fields: {},
            createAt: now,
            updateAt: now,
            deleteAt: 0,
          })
          .run();

        // Card 3: Share & Collaborate
        tx.insert(blocks)
          .values({
            id: card3Id,
            boardId,
            parentId: boardId,
            createdBy: userId,
            modifiedBy: userId,
            type: 'card',
            title: 'Share & Collaborate',
            schema: 1,
            fields: {
              properties: {
                [statusPropId]: statusTodoId,
                [priorityPropId]: priorityLowId
              },
              contentOrder: [card3TextId],
            },
            createAt: now,
            updateAt: now,
            deleteAt: 0,
          })
          .run();

        tx.insert(blocks)
          .values({
            id: card3TextId,
            boardId,
            parentId: card3Id,
            createdBy: userId,
            modifiedBy: userId,
            type: 'text',
            title: 'Invite team members to collaborate on your boards. Share boards with your team, assign tasks, leave comments, and track progress together. Use the Share button in the top right to get started.',
            schema: 1,
            fields: {},
            createAt: now,
            updateAt: now,
            deleteAt: 0,
          })
          .run();
      });

      return c.json({ teamID: teamId, boardID: boardId });
    } catch (error) {
      console.error('Onboarding board creation failed:', error);
      return c.json({ error: 'Failed to create onboarding board' }, 500);
    }
  },
);

export default onboardingRoutes;
