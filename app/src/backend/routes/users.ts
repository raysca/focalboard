import { Hono } from "hono";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type * as schemaType from "../db/schema.ts";
import {
  userProfiles,
  boardMembers,
  preferences,
  user as userTable,
} from "../db/schema.ts";
import { sessionRequired } from "../middleware/auth.ts";
import { eq, inArray } from "drizzle-orm";
import { BadRequestError, ForbiddenError, NotFoundError } from "../errors.ts";

const userRoutes = new Hono();

function buildUserResponse(
  authUser: { id: string; email: string; name: string },
  profile: typeof userProfiles.$inferSelect | undefined,
) {
  return {
    id: authUser.id,
    username: profile?.username ?? authUser.name ?? "",
    email: authUser.email,
    nickname: profile?.nickname ?? "",
    firstname: profile?.firstName ?? "",
    lastname: profile?.lastName ?? "",
    createAt: profile?.createAt ?? 0,
    updateAt: profile?.updateAt ?? 0,
    deleteAt: profile?.deleteAt ?? 0,
    isBot: profile?.isBot ?? false,
    isGuest: profile?.isGuest ?? false,
    roles: profile?.roles ?? "",
  };
}

// GET /users/me
userRoutes.get("/users/me", sessionRequired, async (c) => {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const authUser = c.get("user");
  const userId = c.get("userId") as string;

  const profile = db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .get();

  return c.json(buildUserResponse(authUser, profile));
});

// GET /users/me/memberships
userRoutes.get("/users/me/memberships", sessionRequired, async (c) => {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const userId = c.get("userId") as string;

  const memberships = db
    .select()
    .from(boardMembers)
    .where(eq(boardMembers.userId, userId))
    .all();

  return c.json(memberships);
});

// GET /users/me/config
userRoutes.get("/users/me/config", sessionRequired, async (c) => {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const userId = c.get("userId") as string;

  const prefs = db
    .select()
    .from(preferences)
    .where(eq(preferences.userId, userId))
    .all();

  // Return as a map { category: { name: value } }
  const configMap: Record<string, Record<string, string>> = {};
  for (const pref of prefs) {
    if (!configMap[pref.category]) {
      configMap[pref.category] = {};
    }
    configMap[pref.category]![pref.name] = pref.value;
  }

  return c.json(configMap);
});

// PUT /users/:userID/config
userRoutes.put("/users/:userID/config", sessionRequired, async (c) => {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const userId = c.get("userId") as string;
  const paramUserId = c.req.param("userID");

  if (userId !== paramUserId) {
    throw new ForbiddenError("cannot update another user's config");
  }

  const body = await c.req.json();
  const { category, name, value } = body;

  if (!category || !name) {
    throw new BadRequestError("category and name are required");
  }

  // Upsert preference
  const existing = db
    .select()
    .from(preferences)
    .where(eq(preferences.userId, userId))
    .all()
    .find((p) => p.category === category && p.name === name);

  if (existing) {
    db.update(preferences)
      .set({ value: value ?? "" })
      .where(eq(preferences.userId, userId))
      .run();
  } else {
    db.insert(preferences)
      .values({ userId, category, name, value: value ?? "" })
      .run();
  }

  // Return updated config
  const prefs = db
    .select()
    .from(preferences)
    .where(eq(preferences.userId, userId))
    .all();

  const configMap: Record<string, Record<string, string>> = {};
  for (const pref of prefs) {
    if (!configMap[pref.category]) {
      configMap[pref.category] = {};
    }
    configMap[pref.category]![pref.name] = pref.value;
  }

  return c.json(configMap);
});

// GET /users/:userID
userRoutes.get("/users/:userID", sessionRequired, async (c) => {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const targetUserId = c.req.param("userID");

  const authUser = db
    .select()
    .from(userTable)
    .where(eq(userTable.id, targetUserId))
    .get();

  if (!authUser) {
    throw new NotFoundError("user not found");
  }

  const profile = db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, targetUserId))
    .get();

  return c.json(
    buildUserResponse(
      { id: authUser.id, email: authUser.email, name: authUser.name },
      profile,
    ),
  );
});

// POST /users - get users by list of IDs
userRoutes.post("/users", sessionRequired, async (c) => {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const userIds: string[] = await c.req.json();

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return c.json([]);
  }

  const authUsers = db
    .select()
    .from(userTable)
    .where(inArray(userTable.id, userIds))
    .all();

  const profiles = db
    .select()
    .from(userProfiles)
    .where(inArray(userProfiles.userId, userIds))
    .all();

  const profileMap = new Map(profiles.map((p) => [p.userId, p]));

  return c.json(
    authUsers.map((u) =>
      buildUserResponse(
        { id: u.id, email: u.email, name: u.name },
        profileMap.get(u.id),
      ),
    ),
  );
});

export default userRoutes;
