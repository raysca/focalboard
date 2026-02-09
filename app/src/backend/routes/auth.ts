import {Hono} from "hono";
import type {Auth} from "../auth/index.ts";
import type {BunSQLiteDatabase} from "drizzle-orm/bun-sqlite";
import type * as schemaType from "../db/schema.ts";
import {userProfiles, teams, boards, boardMembers, blocks} from "../db/schema.ts";
import {sessionRequired} from "../middleware/auth.ts";
import {eq} from "drizzle-orm";
import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
} from "../errors.ts";
import {config} from "../config.ts";

const authRoutes = new Hono();

// POST /login
authRoutes.post("/login", async (c) => {
  const auth = c.get("auth") as Auth;
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const body = await c.req.json();
  const {email, username, password} = body;

  if (!password) {
    throw new BadRequestError("password is required");
  }

  const loginEmail = email || username;
  if (!loginEmail) {
    throw new BadRequestError("email or username is required");
  }

  // Sign in with Better Auth - this will set the session cookie
  const response = await auth.api.signInEmail({
    body: {email: loginEmail, password},
    asResponse: true,
    headers: c.req.raw.headers,
  });

  if (!response || response.status !== 200) {
    throw new UnauthorizedError("invalid credentials");
  }

  // Parse the response to get user info
  const data = await response.json();

  if (!data.user) {
    throw new UnauthorizedError("invalid credentials");
  }

  const profile = db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, data.user.id))
    .get();

  // Copy Set-Cookie headers from Better Auth response to our response
  const setCookieHeader = response.headers.get("Set-Cookie");
  if (setCookieHeader) {
    c.header("Set-Cookie", setCookieHeader);
  }

  return c.json({
    token: data.session?.token || "",
    user: {
      id: data.user.id,
      username: profile?.username ?? data.user.email?.split("@")[0] ?? "",
      email: data.user.email,
      nickname: profile?.nickname ?? "",
      firstname: profile?.firstName ?? "",
      lastname: profile?.lastName ?? "",
      createAt: profile?.createAt ?? 0,
      updateAt: profile?.updateAt ?? 0,
      deleteAt: profile?.deleteAt ?? 0,
      isBot: profile?.isBot ?? false,
      isGuest: profile?.isGuest ?? false,
      roles: profile?.roles ?? "",
    },
  });
});

// POST /logout
authRoutes.post("/logout", sessionRequired, async (c) => {
  const auth = c.get("auth") as Auth;
  await auth.api.signOut({
    headers: c.req.raw.headers,
  });
  return c.json({}, 200);
});

// POST /register
authRoutes.post("/register", async (c) => {
  const auth = c.get("auth") as Auth;
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const body = await c.req.json();
  const {email, username, password, token} = body;

  if (!email || !password) {
    throw new BadRequestError("email and password are required");
  }

  if (config.signupToken && token !== config.signupToken) {
    throw new UnauthorizedError("invalid signup token");
  }

  const response = await auth.api.signUpEmail({
    body: {
      email,
      password,
      name: username || email.split("@")[0],
    },
  });

  if (!response?.user) {
    throw new BadRequestError("registration failed");
  }

  if (username) {
    db.update(userProfiles)
      .set({username, updateAt: Date.now()})
      .where(eq(userProfiles.userId, response.user.id))
      .run();
  }

  // Auto-create personal board for new user
  const now = Date.now();
  const boardId = crypto.randomUUID();
  const viewId = crypto.randomUUID();
  const displayName = username || email.split("@")[0];

  // Get the default team (should always exist)
  const defaultTeam = db.select().from(teams).get();
  const teamId = defaultTeam?.id || "team-engineering";

  try {
    // Create personal board
    db.insert(boards)
      .values({
        id: boardId,
        teamId,
        createdBy: response.user.id,
        modifiedBy: response.user.id,
        type: "private",
        title: `${displayName}'s Personal Board`,
        description: "Your personal workspace for tasks and notes",
        icon: "📋",
        showDescription: true,
        isTemplate: false,
        cardProperties: [
          {
            id: "prop-status",
            name: "Status",
            type: "select",
            options: [
              {id: "status-todo", value: "To Do", color: "default"},
              {id: "status-in-progress", value: "In Progress", color: "yellow"},
              {id: "status-done", value: "Done", color: "green"},
            ],
          },
          {
            id: "prop-priority",
            name: "Priority",
            type: "select",
            options: [
              {id: "priority-high", value: "High", color: "red"},
              {id: "priority-medium", value: "Medium", color: "yellow"},
              {id: "priority-low", value: "Low", color: "blue"},
            ],
          },
          {
            id: "prop-due-date",
            name: "Due Date",
            type: "date",
            options: [],
          },
        ],
        createAt: now,
        updateAt: now,
        deleteAt: 0,
      })
      .run();

    // Add user as board member with full permissions
    db.insert(boardMembers)
      .values({
        boardId,
        userId: response.user.id,
        roles: "",
        minimumRole: "",
        schemeAdmin: true,
        schemeEditor: true,
        schemeCommenter: true,
        schemeViewer: true,
      })
      .run();

    // Create default board view (Kanban)
    db.insert(blocks)
      .values({
        id: viewId,
        boardId,
        parentId: boardId,
        createdBy: response.user.id,
        modifiedBy: response.user.id,
        type: "view",
        title: "Board View",
        schema: 1,
        fields: {
          viewType: "board",
          visiblePropertyIds: ["prop-status", "prop-priority", "prop-due-date"],
          hiddenOptionIds: [],
          collapsedOptionIds: [],
          sortOptions: [],
          filter: {operation: "and", filters: []},
          cardOrder: [],
        },
        createAt: now,
        updateAt: now,
        deleteAt: 0,
      })
      .run();
  } catch (error) {
    // Log error but don't fail registration if board creation fails
    console.error("Failed to create personal board for new user:", error);
  }

  return c.json({
    token: response.token,
    user: {
      id: response.user.id,
      username: username || email.split("@")[0],
      email: response.user.email,
    },
  });
});

// POST /teams/:teamID/regenerate_signup_token
authRoutes.post(
  "/teams/:teamID/regenerate_signup_token",
  sessionRequired,
  async (c) => {
    const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
    const teamId = c.req.param("teamID");
    const newToken = crypto.randomUUID();

    db.update(teams)
      .set({
        signupToken: newToken,
        modifiedBy: c.get("userId"),
        updateAt: Date.now(),
      })
      .where(eq(teams.id, teamId))
      .run();

    return c.json({token: newToken});
  },
);

// POST /users/:userID/changepassword
authRoutes.post(
  "/users/:userID/changepassword",
  sessionRequired,
  async (c) => {
    const auth = c.get("auth") as Auth;
    const userID = c.req.param("userID");
    const currentUserId = c.get("userId");

    if (userID !== currentUserId) {
      throw new ForbiddenError("cannot change another user's password");
    }

    const body = await c.req.json();
    const {oldPassword, newPassword} = body;

    if (!oldPassword || !newPassword) {
      throw new BadRequestError("oldPassword and newPassword are required");
    }

    try {
      await auth.api.changePassword({
        body: {currentPassword: oldPassword, newPassword},
        headers: c.req.raw.headers,
      });
    } catch {
      throw new BadRequestError("incorrect current password");
    }

    return c.json({}, 200);
  },
);

export default authRoutes;
