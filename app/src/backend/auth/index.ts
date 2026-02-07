import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins/bearer";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import * as schema from "../db/schema.ts";
import { config } from "../config.ts";

export function createAuth(db: BunSQLiteDatabase<typeof schema>) {
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema,
    }),
    plugins: [bearer()],
    appName: "Focalboard",
    baseURL: config.serverRoot,
    basePath: "/api/auth",
    secret:
      process.env.BETTER_AUTH_SECRET || "focalboard-dev-secret-change-me",
    emailAndPassword: {
      enabled: true,
    },
    socialProviders: {
      ...(config.githubClientId
        ? {
            github: {
              clientId: config.githubClientId,
              clientSecret: config.githubClientSecret,
            },
          }
        : {}),
      ...(config.googleClientId
        ? {
            google: {
              clientId: config.googleClientId,
              clientSecret: config.googleClientSecret,
            },
          }
        : {}),
    },
    session: {
      expiresIn: config.sessionExpireTime,
      updateAge: config.sessionRefreshTime,
    },
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            const now = Date.now();
            try {
              db.insert(schema.userProfiles)
                .values({
                  userId: user.id,
                  username: user.email?.split("@")[0] ?? "",
                  createAt: now,
                  updateAt: now,
                })
                .run();
            } catch (err) {
              console.error("Failed to create user profile:", err);
            }
          },
        },
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
