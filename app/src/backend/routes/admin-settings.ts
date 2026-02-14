import { Hono } from "hono"
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite"
import type * as schemaType from "../db/schema.ts"
import { sessionRequired, adminRequired } from "../middleware/auth.ts"
import { AdminSettingsService } from "../services/admin-settings.service.ts"
import {
    updateSettingSchema,
    bulkUpdateSettingsSchema,
    type UpdateSettingInput,
    type BulkUpdateSettingsInput,
} from "../validation/schemas.ts"
import { BadRequestError } from "../errors.ts"

const adminSettingsRoutes = new Hono()

// GET /api/admin/settings?category={category}
// List all settings (optionally filtered by category)
adminSettingsRoutes.get(
    "/admin/settings",
    sessionRequired,
    adminRequired,
    async (c) => {
        const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>
        const category = c.req.query("category")

        const service = new AdminSettingsService(db)
        const settings = service.getSettingsByCategory(category)

        return c.json({ settings })
    }
)

// GET /api/admin/settings/:id
// Get single setting
adminSettingsRoutes.get(
    "/admin/settings/:id",
    sessionRequired,
    adminRequired,
    async (c) => {
        const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>
        const id = c.req.param("id")

        const service = new AdminSettingsService(db)
        const setting = service.getSettingRecord(id)

        if (!setting) {
            return c.json({ error: "Setting not found" }, 404)
        }

        return c.json({ setting })
    }
)

// PUT /api/admin/settings/:id
// Update single setting with validation
adminSettingsRoutes.put(
    "/admin/settings/:id",
    sessionRequired,
    adminRequired,
    async (c) => {
        const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>
        const id = c.req.param("id")
        const userId = c.get("userId") as string

        const body = await c.req.json()
        const validated = updateSettingSchema.parse(body) as UpdateSettingInput

        const service = new AdminSettingsService(db)
        const updatedSetting = await service.updateSetting(
            id,
            validated.value,
            userId,
            validated.reason
        )

        return c.json({ setting: updatedSetting })
    }
)

// PUT /api/admin/settings
// Bulk update multiple settings (transactional)
adminSettingsRoutes.put(
    "/admin/settings",
    sessionRequired,
    adminRequired,
    async (c) => {
        const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>
        const userId = c.get("userId") as string

        const body = await c.req.json()
        const validated = bulkUpdateSettingsSchema.parse(body) as BulkUpdateSettingsInput

        if (validated.length === 0) {
            throw new BadRequestError("No settings provided for update")
        }

        const service = new AdminSettingsService(db)
        const updatedSettings = await service.bulkUpdateSettings(validated, userId)

        return c.json({ settings: updatedSettings })
    }
)

// POST /api/admin/settings/reset/:id
// Reset to default value
adminSettingsRoutes.post(
    "/admin/settings/reset/:id",
    sessionRequired,
    adminRequired,
    async (c) => {
        const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>
        const id = c.req.param("id")
        const userId = c.get("userId") as string

        const service = new AdminSettingsService(db)
        const resetSetting = await service.resetSetting(id, userId)

        return c.json({ setting: resetSetting })
    }
)

// GET /api/admin/settings/:id/history
// Get setting change history
adminSettingsRoutes.get(
    "/admin/settings/:id/history",
    sessionRequired,
    adminRequired,
    async (c) => {
        const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>
        const id = c.req.param("id")
        const limit = parseInt(c.req.query("limit") ?? "50")

        const service = new AdminSettingsService(db)
        const history = service.getSettingHistory(id, limit)

        return c.json({ history })
    }
)

export default adminSettingsRoutes
