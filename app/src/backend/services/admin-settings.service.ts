import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite"
import * as schema from "../db/schema.ts"
import { adminSettings, adminSettingsHistory } from "../db/schema.ts"
import { eq, and } from "drizzle-orm"
import { BadRequestError, NotFoundError } from "../errors.ts"
import type { DB } from "./transaction.ts"

export interface AdminSetting {
    id: string
    category: string
    key: string
    value: unknown
    valueType: string
    defaultValue: unknown
    description: string
    isPublic: boolean
    constraints: Record<string, unknown>
    modifiedBy: string | null
    createAt: number
    updateAt: number
}

export interface SettingHistoryEntry {
    id: string
    category: string
    key: string
    oldValue: unknown
    newValue: unknown
    changedBy: string
    changedAt: number
    reason: string | null
}

export class AdminSettingsService {
    constructor(private db: DB) {}

    /**
     * Get a single setting value by ID
     * Returns the typed value or undefined if not found
     */
    getSetting<T = unknown>(id: string): T | undefined {
        const setting = this.db
            .select()
            .from(adminSettings)
            .where(eq(adminSettings.id, id))
            .get()

        if (!setting) {
            return undefined
        }

        return setting.value as T
    }

    /**
     * Get all settings, optionally filtered by category
     * Returns only public settings if isPublic is true
     */
    getSettingsByCategory(category?: string, publicOnly = false): AdminSetting[] {
        let query = this.db.select().from(adminSettings)

        if (category) {
            query = query.where(eq(adminSettings.category, category)) as typeof query
        }

        if (publicOnly) {
            const condition = category
                ? and(eq(adminSettings.category, category), eq(adminSettings.isPublic, true))
                : eq(adminSettings.isPublic, true)
            query = query.where(condition) as typeof query
        }

        return query.all() as AdminSetting[]
    }

    /**
     * Get a full setting record by ID
     */
    getSettingRecord(id: string): AdminSetting | undefined {
        const setting = this.db
            .select()
            .from(adminSettings)
            .where(eq(adminSettings.id, id))
            .get()

        return setting as AdminSetting | undefined
    }

    /**
     * Update a setting value with validation and history tracking
     */
    async updateSetting(
        id: string,
        value: unknown,
        userId: string,
        reason?: string
    ): Promise<AdminSetting> {
        const setting = this.getSettingRecord(id)

        if (!setting) {
            throw new NotFoundError(`Setting ${id} not found`)
        }

        // Validate the new value
        this.validateSettingValue(setting, value)

        const now = Date.now()
        const oldValue = setting.value

        // Update the setting
        this.db
            .update(adminSettings)
            .set({
                value: JSON.stringify(value),
                modifiedBy: userId,
                updateAt: now,
            })
            .where(eq(adminSettings.id, id))
            .run()

        // Record history
        this.db.insert(adminSettingsHistory).values({
            id: setting.id,
            category: setting.category,
            key: setting.key,
            oldValue: JSON.stringify(oldValue),
            newValue: JSON.stringify(value),
            changedBy: userId,
            changedAt: now,
            reason: reason || "",
        }).run()

        // Return updated setting
        return this.getSettingRecord(id)!
    }

    /**
     * Bulk update multiple settings in a single operation
     * Returns array of updated settings
     */
    async bulkUpdateSettings(
        updates: Array<{ id: string; value: unknown }>,
        userId: string
    ): Promise<AdminSetting[]> {
        const updatedSettings: AdminSetting[] = []

        for (const update of updates) {
            const setting = await this.updateSetting(
                update.id,
                update.value,
                userId
            )
            updatedSettings.push(setting)
        }

        return updatedSettings
    }

    /**
     * Reset a setting to its default value
     */
    async resetSetting(id: string, userId: string): Promise<AdminSetting> {
        const setting = this.getSettingRecord(id)

        if (!setting) {
            throw new NotFoundError(`Setting ${id} not found`)
        }

        return await this.updateSetting(
            id,
            setting.defaultValue,
            userId,
            "Reset to default value"
        )
    }

    /**
     * Get change history for a specific setting
     */
    getSettingHistory(id: string, limit = 50): SettingHistoryEntry[] {
        const history = this.db
            .select()
            .from(adminSettingsHistory)
            .where(eq(adminSettingsHistory.id, id))
            .orderBy(adminSettingsHistory.changedAt)
            .limit(limit)
            .all()

        return history as SettingHistoryEntry[]
    }

    /**
     * Validate a setting value against its constraints
     * Throws BadRequestError if validation fails
     */
    private validateSettingValue(setting: AdminSetting, value: unknown): void {
        // Type validation
        const actualType = typeof value
        const expectedType = setting.valueType

        if (expectedType === "boolean" && actualType !== "boolean") {
            throw new BadRequestError(`Setting ${setting.id} must be a boolean`)
        }

        if (expectedType === "number" && actualType !== "number") {
            throw new BadRequestError(`Setting ${setting.id} must be a number`)
        }

        if (expectedType === "string" && actualType !== "string") {
            throw new BadRequestError(`Setting ${setting.id} must be a string`)
        }

        // Constraint validation
        const constraints = setting.constraints || {}

        // Min/max for numbers
        if (expectedType === "number" && actualType === "number") {
            if (
                constraints.min !== undefined &&
                (value as number) < (constraints.min as number)
            ) {
                throw new BadRequestError(
                    `Setting ${setting.id} must be at least ${constraints.min}`
                )
            }

            if (
                constraints.max !== undefined &&
                (value as number) > (constraints.max as number)
            ) {
                throw new BadRequestError(
                    `Setting ${setting.id} must be at most ${constraints.max}`
                )
            }
        }

        // Min/max length for strings
        if (expectedType === "string" && actualType === "string") {
            if (
                constraints.minLength !== undefined &&
                (value as string).length < (constraints.minLength as number)
            ) {
                throw new BadRequestError(
                    `Setting ${setting.id} must be at least ${constraints.minLength} characters`
                )
            }

            if (
                constraints.maxLength !== undefined &&
                (value as string).length > (constraints.maxLength as number)
            ) {
                throw new BadRequestError(
                    `Setting ${setting.id} must be at most ${constraints.maxLength} characters`
                )
            }
        }

        // Enum validation
        if (constraints.enum && Array.isArray(constraints.enum)) {
            if (!(constraints.enum as unknown[]).includes(value)) {
                throw new BadRequestError(
                    `Setting ${setting.id} must be one of: ${(constraints.enum as unknown[]).join(", ")}`
                )
            }
        }

        // Pattern validation for strings
        if (
            expectedType === "string" &&
            actualType === "string" &&
            constraints.pattern
        ) {
            const regex = new RegExp(constraints.pattern as string)
            if (!regex.test(value as string)) {
                throw new BadRequestError(
                    `Setting ${setting.id} does not match required pattern`
                )
            }
        }
    }
}
