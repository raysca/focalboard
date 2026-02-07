/**
 * Seed script for Focalboard development.
 * Creates default team, admin user, and welcome board with sample cards.
 *
 * Usage: bun src/backend/db/seed.ts
 */
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import * as schema from "./schema.ts";
import { config } from "../config.ts";
import { createAuth } from "../auth/index.ts";
import { eq } from "drizzle-orm";

const dbPath = config.dbconfig.split("?")[0]!;
const sqlite = new Database(dbPath, { create: true });
sqlite.exec("PRAGMA journal_mode = WAL;");
sqlite.exec("PRAGMA foreign_keys = ON;");
sqlite.exec("PRAGMA busy_timeout = 5000;");

const db = drizzle(sqlite, { schema });
migrate(db, { migrationsFolder: "./src/backend/db/migrations" });

const auth = createAuth(db);
const now = Date.now();

// 1. Create default team
const teamId = "0";
const existingTeam = db
  .select()
  .from(schema.teams)
  .where(eq(schema.teams.id, teamId))
  .get();

if (!existingTeam) {
  db.insert(schema.teams)
    .values({
      id: teamId,
      title: "Default Team",
      signupToken: crypto.randomUUID(),
      modifiedBy: "system",
      updateAt: now,
    })
    .run();
  console.log("Created default team (ID: 0)");
} else {
  console.log("Default team already exists");
}

// 2. Create admin user via Better Auth
const adminEmail = "admin@focalboard.local";
const adminPassword = "admin123";

const existingUser = db
  .select()
  .from(schema.user)
  .where(eq(schema.user.email, adminEmail))
  .get();

if (!existingUser) {
  const result = await auth.api.signUpEmail({
    body: {
      email: adminEmail,
      password: adminPassword,
      name: "Admin",
    },
  });

  if (result?.user?.id) {
    // Set admin role
    db.update(schema.userProfiles)
      .set({ roles: "admin", username: "admin" })
      .where(eq(schema.userProfiles.userId, result.user.id))
      .run();

    console.log(`Created admin user: ${adminEmail} / ${adminPassword}`);

    // 3. Create welcome board
    const boardId = crypto.randomUUID();
    db.insert(schema.boards)
      .values({
        id: boardId,
        teamId,
        createdBy: result.user.id,
        modifiedBy: result.user.id,
        type: "O",
        title: "Welcome to Focalboard!",
        description:
          "This is your first board. Use it to track tasks, plan projects, or organize ideas.",
        icon: "wave",
        showDescription: true,
        createAt: now,
        updateAt: now,
        deleteAt: 0,
      })
      .run();

    // Add admin as board member
    db.insert(schema.boardMembers)
      .values({
        boardId,
        userId: result.user.id,
        roles: "",
        minimumRole: "",
        schemeAdmin: true,
        schemeEditor: true,
        schemeCommenter: true,
        schemeViewer: true,
      })
      .run();

    // Create sample cards
    const sampleCards = [
      {
        title: "Learn about boards",
        fields: { icon: "book", status: "To Do" },
      },
      {
        title: "Create your first card",
        fields: { icon: "pencil", status: "In Progress" },
      },
      {
        title: "Invite team members",
        fields: { icon: "people", status: "To Do" },
      },
    ];

    for (const card of sampleCards) {
      db.insert(schema.blocks)
        .values({
          id: crypto.randomUUID(),
          parentId: boardId,
          boardId,
          type: "card",
          title: card.title,
          fields: card.fields,
          createdBy: result.user.id,
          modifiedBy: result.user.id,
          createAt: now,
          updateAt: now,
          deleteAt: 0,
        })
        .run();
    }

    console.log(`Created welcome board with ${sampleCards.length} sample cards`);
  }
} else {
  console.log("Admin user already exists");
}

console.log("Seed complete.");
sqlite.close();
