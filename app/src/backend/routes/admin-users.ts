import { Hono } from "hono"
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite"
import type * as schemaType from "../db/schema.ts"
import { user, userProfiles } from "../db/schema.ts"
import { sessionRequired, adminRequired } from "../middleware/auth.ts"
import { eq, like, or } from "drizzle-orm"
import { BadRequestError, ForbiddenError } from "../errors.ts"
import {
    updateUserRoleSchema,
    type UpdateUserRoleInput,
} from "../validation/schemas.ts"

const adminUsersRoutes = new Hono()

// GET /api/admin/users?page={page}&per_page={perPage}&search={search}
// List users with pagination and optional search
adminUsersRoutes.get(
    "/admin/users",
    sessionRequired,
    adminRequired,
    async (c) => {
        const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>
        const page = parseInt(c.req.query("page") ?? "0")
        const perPage = parseInt(c.req.query("per_page") ?? "50")
        const search = c.req.query("search")

        let query = db
            .select({
                id: user.id,
                name: user.name,
                email: user.email,
                emailVerified: user.emailVerified,
                image: user.image,
                createdAt: user.createdAt,
                username: userProfiles.username,
                firstName: userProfiles.firstName,
                lastName: userProfiles.lastName,
                roles: userProfiles.roles,
                isGuest: userProfiles.isGuest,
                isBot: userProfiles.isBot,
            })
            .from(user)
            .leftJoin(userProfiles, eq(user.id, userProfiles.userId))

        // Apply search filter if provided
        if (search) {
            query = query.where(
                or(
                    like(user.name, `%${search}%`),
                    like(user.email, `%${search}%`),
                    like(userProfiles.username, `%${search}%`)
                )
            ) as typeof query
        }

        const users = query
            .limit(perPage)
            .offset(page * perPage)
            .all()

        return c.json({
            users,
            page,
            perPage,
            hasMore: users.length === perPage,
        })
    }
)

// PUT /api/admin/users/:userId/role
// Grant or revoke admin role
adminUsersRoutes.put(
    "/admin/users/:userId/role",
    sessionRequired,
    adminRequired,
    async (c) => {
        const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>
        const targetUserId = c.req.param("userId")
        const currentUserId = c.get("userId") as string

        const body = await c.req.json()
        const validated = updateUserRoleSchema.parse(body) as UpdateUserRoleInput

        // Get target user profile
        const targetProfile = db
            .select()
            .from(userProfiles)
            .where(eq(userProfiles.userId, targetUserId))
            .get()

        if (!targetProfile) {
            throw new BadRequestError("User not found")
        }

        // Prevent removing admin role from last admin
        if (validated.role === "user") {
            const allAdmins = db
                .select()
                .from(userProfiles)
                .where(like(userProfiles.roles, "%admin%"))
                .all()

            if (allAdmins.length <= 1 && targetProfile.roles?.includes("admin")) {
                throw new ForbiddenError(
                    "Cannot remove admin role from the last admin user"
                )
            }
        }

        // Update role
        const newRoles = validated.role === "admin" ? "admin" : ""
        db.update(userProfiles)
            .set({
                roles: newRoles,
                updateAt: Date.now(),
            })
            .where(eq(userProfiles.userId, targetUserId))
            .run()

        // Get updated profile
        const updatedProfile = db
            .select()
            .from(userProfiles)
            .where(eq(userProfiles.userId, targetUserId))
            .get()

        return c.json({
            user: {
                userId: targetUserId,
                roles: updatedProfile?.roles || "",
            },
        })
    }
)

// POST /api/admin/users/:userId/disable
// Disable user account (soft delete)
adminUsersRoutes.post(
    "/admin/users/:userId/disable",
    sessionRequired,
    adminRequired,
    async (c) => {
        const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>
        const targetUserId = c.req.param("userId")
        const currentUserId = c.get("userId") as string

        // Prevent self-disable
        if (targetUserId === currentUserId) {
            throw new BadRequestError("Cannot disable your own account")
        }

        // Get target user profile
        const targetProfile = db
            .select()
            .from(userProfiles)
            .where(eq(userProfiles.userId, targetUserId))
            .get()

        if (!targetProfile) {
            throw new BadRequestError("User not found")
        }

        // Prevent disabling last admin
        if (targetProfile.roles?.includes("admin")) {
            const allAdmins = db
                .select()
                .from(userProfiles)
                .where(like(userProfiles.roles, "%admin%"))
                .all()

            if (allAdmins.length <= 1) {
                throw new ForbiddenError("Cannot disable the last admin user")
            }
        }

        // Soft delete user profile
        db.update(userProfiles)
            .set({
                deleteAt: Date.now(),
                updateAt: Date.now(),
            })
            .where(eq(userProfiles.userId, targetUserId))
            .run()

        return c.json({ success: true })
    }
)

export default adminUsersRoutes
