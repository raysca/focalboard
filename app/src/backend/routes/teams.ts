import { Hono } from "hono";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type * as schemaType from "../db/schema.ts";
import {
  teams,
  userProfiles,
  user as userTable,
} from "../db/schema.ts";
import { sessionRequired } from "../middleware/auth.ts";
import { eq, inArray, like, and } from "drizzle-orm";
import { NotFoundError } from "../errors.ts";

const teamRoutes = new Hono();

// GET /teams
teamRoutes.get("/teams", sessionRequired, async (c) => {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const allTeams = db.select().from(teams).all();
  return c.json(allTeams);
});

// GET /teams/:teamID
teamRoutes.get("/teams/:teamID", sessionRequired, async (c) => {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const teamId = c.req.param("teamID");

  const team = db.select().from(teams).where(eq(teams.id, teamId)).get();
  if (!team) {
    throw new NotFoundError("team not found");
  }

  return c.json(team);
});

// GET /teams/:teamID/users
teamRoutes.get("/teams/:teamID/users", sessionRequired, async (c) => {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const search = c.req.query("search") ?? "";
  const excludeBots = c.req.query("exclude_bots") === "true";

  let profiles;
  if (search) {
    profiles = db
      .select()
      .from(userProfiles)
      .where(like(userProfiles.username, `%${search}%`))
      .all();
  } else {
    profiles = db.select().from(userProfiles).all();
  }

  if (excludeBots) {
    profiles = profiles.filter((p) => !p.isBot);
  }

  const userIds = profiles.map((p) => p.userId);
  if (userIds.length === 0) {
    return c.json([]);
  }

  const authUsers = db
    .select()
    .from(userTable)
    .where(inArray(userTable.id, userIds))
    .all();

  const authUserMap = new Map(authUsers.map((u) => [u.id, u]));

  return c.json(
    profiles.map((p) => {
      const au = authUserMap.get(p.userId);
      return {
        id: p.userId,
        username: p.username,
        email: au?.email ?? "",
        nickname: p.nickname,
        firstname: p.firstName,
        lastname: p.lastName,
        createAt: p.createAt,
        updateAt: p.updateAt,
        deleteAt: p.deleteAt,
        isBot: p.isBot,
        isGuest: p.isGuest,
        roles: p.roles,
      };
    }),
  );
});

// POST /teams/:teamID/users - get team users by ID list
teamRoutes.post("/teams/:teamID/users", sessionRequired, async (c) => {
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
    authUsers.map((u) => {
      const p = profileMap.get(u.id);
      return {
        id: u.id,
        username: p?.username ?? u.name ?? "",
        email: u.email,
        nickname: p?.nickname ?? "",
        firstname: p?.firstName ?? "",
        lastname: p?.lastName ?? "",
        createAt: p?.createAt ?? 0,
        updateAt: p?.updateAt ?? 0,
        deleteAt: p?.deleteAt ?? 0,
        isBot: p?.isBot ?? false,
        isGuest: p?.isGuest ?? false,
        roles: p?.roles ?? "",
      };
    }),
  );
});

export default teamRoutes;
