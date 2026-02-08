import {Database} from "bun:sqlite";
import {drizzle} from "drizzle-orm/bun-sqlite";
import {migrate} from "drizzle-orm/bun-sqlite/migrator";
import * as schema from "../src/backend/db/schema.ts";
import {config} from "../src/backend/config.ts";
import {createAuth} from "../src/backend/auth/index.ts";
import {eq} from "drizzle-orm";
import {SEED_DATA} from "./data.ts";

// Initialize DB connection
const dbPath = config.dbconfig.split("?")[0]!;
const sqlite = new Database(dbPath, {create: true});
sqlite.exec("PRAGMA journal_mode = WAL;");
sqlite.exec("PRAGMA foreign_keys = ON;");
sqlite.exec("PRAGMA busy_timeout = 5000;");

const db = drizzle(sqlite, {schema});

// Run migrations first
console.log("Running migrations...");
migrate(db, {migrationsFolder: "./src/backend/db/migrations"});
console.log("Migrations complete.");

const auth = createAuth(db);
const now = Date.now();

async function seed() {
    console.log("Starting seed...");

    // 1. Create default team
    const {team} = SEED_DATA;
    const existingTeam = db
        .select()
        .from(schema.teams)
        .where(eq(schema.teams.id, team.id))
        .get();

    if (!existingTeam) {
        db.insert(schema.teams)
            .values({
                id: team.id,
                title: team.title,
                signupToken: crypto.randomUUID(),
                modifiedBy: team.modifiedBy,
                updateAt: now,
            })
            .run();
        console.log(`Created default team (ID: ${team.id})`);
    } else {
        console.log("Default team already exists");
    }

    // 2. Create users
    for (const userData of SEED_DATA.users) {
        const existingUser = db
            .select()
            .from(schema.user)
            .where(eq(schema.user.email, userData.email))
            .get();

        if (!existingUser) {
            const result = await auth.api.signUpEmail({
                body: {
                    email: userData.email,
                    password: userData.password,
                    name: userData.name,
                },
            });

            if (result?.user?.id) {
                // Set roles and profile data
                db.update(schema.userProfiles)
                    .set({
                        roles: userData.roles,
                        username: userData.username
                    })
                    .where(eq(schema.userProfiles.userId, result.user.id))
                    .run();

                console.log(`Created user: ${userData.email} (${userData.roles})`);

                // If admin, create welcome board
                if (userData.roles === 'admin') {
                    // 3. Create welcome board for admin
                    const {welcomeBoard} = SEED_DATA;
                    const boardId = crypto.randomUUID();

                    db.insert(schema.boards)
                        .values({
                            id: boardId,
                            teamId: team.id,
                            createdBy: result.user.id,
                            modifiedBy: result.user.id,
                            type: welcomeBoard.type,
                            title: welcomeBoard.title,
                            description: welcomeBoard.description,
                            icon: welcomeBoard.icon,
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
                            roles: "admin",
                            minimumRole: "",
                            schemeAdmin: true,
                            schemeEditor: true,
                            schemeCommenter: true,
                            schemeViewer: true,
                        })
                        .run();

                    // Create sample cards
                    for (const card of welcomeBoard.cards) {
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
                    console.log(`Created welcome board for admin`);
                }
            }
        } else {
            console.log(`User ${userData.email} already exists`);
        }
    }

    console.log("Seed complete.");
    sqlite.close();
}

seed().catch((err) => {
    console.error("Seed failed:", err);
    sqlite.close();
    process.exit(1);
});
