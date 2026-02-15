# Database Configuration Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor database configuration to use file-based SQLite in production and in-memory SQLite during tests for improved test performance and isolation.

**Architecture:** Add environment detection via `NODE_ENV` to `src/backend/db/index.ts`. When `NODE_ENV=test`, use `:memory:` database instead of file-based. Update test configurations to set this variable. All existing migrations and seeds work transparently with both modes.

**Tech Stack:** Bun SQLite, Drizzle ORM, Playwright, TypeScript

---

## Task 1: Update Database Initialization Logic

**Files:**
- Modify: `app/src/backend/db/index.ts:1-23`

**Step 1: Add environment detection and update database path logic**

Replace the current database path logic with environment-aware version:

```typescript
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "./schema.ts";
import { config } from "../config.ts";

// Detect test environment
const isTest = process.env.NODE_ENV === 'test'

// Use in-memory database for tests, file-based for production/development
const dbPath = isTest ? ':memory:' : config.dbconfig.split("?")[0]!;

// Log database mode for debugging
console.log(`[DB] Using ${isTest ? 'in-memory' : 'file-based'} database: ${dbPath}`)

const sqlite = new Database(dbPath, { create: true });

// Use DELETE journal mode for in-memory/test databases, WAL for production
// WAL mode is not applicable to in-memory databases
const isMemoryOrTestDb = dbPath === ':memory:' || dbPath.includes('test.db')
const journalMode = isMemoryOrTestDb ? 'DELETE' : 'WAL'

sqlite.exec(`PRAGMA journal_mode = ${journalMode};`);
sqlite.exec("PRAGMA busy_timeout = 10000;");
sqlite.exec("PRAGMA foreign_keys = ON;");

export const db = drizzle(sqlite, { schema });

export { sqlite };
```

**Step 2: Verify the code compiles**

Run: `cd app && bun run build.ts`
Expected: Build succeeds with no TypeScript errors

**Step 3: Commit database initialization changes**

```bash
git add app/src/backend/db/index.ts
git commit -m "feat: add environment-based database configuration

- Use in-memory SQLite when NODE_ENV=test
- Use file-based SQLite for production/development
- Add logging to show database mode
- Update journal mode logic for in-memory databases

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Update Playwright Configuration

**Files:**
- Modify: `app/playwright.config.ts:35-42`

**Step 1: Update webServer configuration to use NODE_ENV**

Replace the `webServer` section:

```typescript
webServer: {
    command: 'NODE_ENV=test bun dev',
    url: 'http://localhost:8088',
    reuseExistingServer: false,
    env: {
        NODE_ENV: 'test',
    },
},
```

**Step 2: Verify Playwright config is valid**

Run: `cd app && bunx playwright test --list`
Expected: Tests are listed without configuration errors

**Step 3: Commit Playwright configuration changes**

```bash
git add app/playwright.config.ts
git commit -m "feat: configure Playwright to use in-memory database

- Set NODE_ENV=test for test server
- Remove DB_CONFIG env var (no longer needed)
- Tests now use in-memory database automatically

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Update Package.json Test Scripts

**Files:**
- Modify: `app/package.json` (scripts section)

**Step 1: Update test scripts to set NODE_ENV**

Find the scripts section and update test commands:

```json
{
  "scripts": {
    "dev": "bun --hot ./src/index.ts",
    "start": "bun ./src/index.ts",
    "build": "bun run build.ts",
    "test": "NODE_ENV=test bun test",
    "test:e2e": "NODE_ENV=test playwright test",
    "test:e2e:ui": "NODE_ENV=test playwright test --ui",
    "test:e2e:debug": "NODE_ENV=test playwright test --debug",
    "test:e2e:headed": "NODE_ENV=test playwright test --headed",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "db:seed": "bun src/backend/db/seed.ts"
  }
}
```

**Step 2: Verify package.json is valid JSON**

Run: `cd app && bun install --dry-run`
Expected: No JSON syntax errors

**Step 3: Commit package.json changes**

```bash
git add app/package.json
git commit -m "feat: update test scripts to use NODE_ENV=test

- All test commands now set NODE_ENV=test
- Ensures in-memory database is used for all tests
- Maintains cross-platform compatibility

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Verify In-Memory Database Works

**Files:**
- None (verification only)

**Step 1: Clean any existing test database files**

Run: `cd app && rm -f focalboard-test.db focalboard-test.db-shm focalboard-test.db-wal`
Expected: Test database files removed (if they existed)

**Step 2: Start dev server with test environment**

Run: `cd app && NODE_ENV=test bun dev`
Expected: Console shows `[DB] Using in-memory database: :memory:`

Stop the server with Ctrl+C after verifying the log message.

**Step 3: Verify no database file was created**

Run: `cd app && ls -la | grep focalboard`
Expected: Only `focalboard.db` (production) exists, no `focalboard-test.db`

**Step 4: Verify normal dev mode uses file-based database**

Run: `cd app && bun dev`
Expected: Console shows `[DB] Using file-based database: ./focalboard.db`

Stop the server with Ctrl+C.

---

## Task 5: Run E2E Tests with In-Memory Database

**Files:**
- None (verification only)

**Step 1: Seed the test database**

Run: `cd app && NODE_ENV=test bun src/backend/db/seed.ts --force`
Expected: Seed completes successfully, log shows in-memory database usage

**Step 2: Run E2E tests**

Run: `cd app && bun test:e2e`
Expected: All tests pass, console shows `[DB] Using in-memory database: :memory:`

**Step 3: Verify no test database file created**

Run: `cd app && ls -la | grep "focalboard-test"`
Expected: No `focalboard-test.db` files exist

**Step 4: Benchmark test execution time (optional)**

Run: `cd app && time bun test:e2e`
Note: Record execution time for comparison with future runs
Expected: Tests complete successfully, execution time noted

---

## Task 6: Document Configuration Changes

**Files:**
- Modify: `app/CLAUDE.md` (E2E Testing section)

**Step 1: Update E2E testing documentation**

Update the E2E Testing section to reflect new configuration:

```markdown
## E2E Testing

Playwright is used for browser-based end-to-end testing. Tests validate real user workflows across Chrome, Firefox, and Safari.

**Database Configuration:**
- Tests automatically use in-memory SQLite (`:memory:`) when `NODE_ENV=test`
- No test database files are created or need cleanup
- Each test run gets a fresh, isolated database

### Running E2E Tests

**IMPORTANT: Seed the database before running tests:**

```sh
cd app
bun src/backend/db/seed.ts --force  # Seed with test data (in-memory)
bun test:e2e                        # Run all E2E tests
```

**Debugging with File-Based Database:**

If you need to inspect the test database after tests run:

```sh
NODE_ENV=development bun test:e2e  # Uses file-based database
```

This creates `focalboard-test.db` that you can inspect with tools like DB Browser for SQLite.

**Available Scripts:**

```sh
bun test:e2e          # Run all tests (headless, in-memory)
bun test:e2e:ui       # Open Playwright UI mode for debugging
bun test:e2e:debug    # Run with debugger
bun test:e2e:headed   # Run with visible browser
```
```

**Step 2: Commit documentation updates**

```bash
git add app/CLAUDE.md
git commit -m "docs: update E2E testing documentation for in-memory database

- Document in-memory database usage in tests
- Add debugging tip for file-based database override
- Clarify no cleanup needed for test databases

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Clean Up Legacy Test Database References

**Files:**
- None (cleanup only)

**Step 1: Remove any lingering test database files**

Run: `cd app && rm -f focalboard-test.db focalboard-test.db-shm focalboard-test.db-wal 2>/dev/null || true`
Expected: Test database files removed (silently continues if they don't exist)

**Step 2: Verify gitignore includes test databases**

Run: `cd app && grep "focalboard" .gitignore || echo "*.db" >> .gitignore`
Expected: Database files are ignored by git

**Step 3: Check for any hardcoded test database references**

Run: `cd app && grep -r "focalboard-test.db" src/ tests/ 2>/dev/null || echo "No hardcoded references found"`
Expected: Either "No hardcoded references found" or list of files to manually review

If files are found, review and update them to use environment-based configuration instead.

---

## Task 8: Final Verification

**Files:**
- None (verification only)

**Step 1: Run full E2E test suite**

Run: `cd app && bun test:e2e`
Expected: All tests pass with in-memory database

**Step 2: Verify development mode unchanged**

Run: `cd app && bun dev`
Expected: Server starts, console shows file-based database, application works normally

Stop with Ctrl+C.

**Step 3: Verify production build works**

Run: `cd app && bun run build.ts && bun start`
Expected: Production server starts successfully with file-based database

Stop with Ctrl+C.

**Step 4: Final commit with all changes**

If any additional cleanup or fixes were needed:

```bash
git add -A
git commit -m "chore: final cleanup for database config refactor

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Verification Checklist

After completing all tasks, verify:

- [ ] `NODE_ENV=test bun dev` shows in-memory database log
- [ ] `bun dev` (no NODE_ENV) shows file-based database log
- [ ] `bun test:e2e` passes all tests
- [ ] No `focalboard-test.db` files created after tests
- [ ] Development server works normally
- [ ] Production build works normally
- [ ] Console logs clearly indicate database mode
- [ ] All commits are properly formatted

## Rollback Instructions

If issues occur, rollback in reverse order:

1. `git revert HEAD~7..HEAD` (revert last 7 commits)
2. `git checkout app/src/backend/db/index.ts` (restore original)
3. `git checkout app/playwright.config.ts` (restore original)
4. `git checkout app/package.json` (restore original)
5. Run tests to verify rollback: `cd app && bun test:e2e`

## Notes

- The in-memory database exists only for the lifetime of the Bun process
- Each Playwright test run gets a fresh database via webServer restart
- Migrations and seeds run automatically via global-setup.ts
- For debugging, override with `NODE_ENV=development bun test:e2e`
