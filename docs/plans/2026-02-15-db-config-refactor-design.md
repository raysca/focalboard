# Database Configuration Refactor: File-Based vs In-Memory

**Date:** 2026-02-15
**Status:** Approved
**Author:** Claude Code

## Overview

Refactor the database configuration to use file-based SQLite in production and in-memory SQLite during tests. This improves test performance, isolation, and eliminates the need for database cleanup between test runs.

## Goals

- Use file-based SQLite for production and development (current behavior)
- Use in-memory SQLite (`:memory:`) for all tests (E2E and unit tests)
- Maintain compatibility with existing migrations and seed scripts
- Provide clear environment-based detection with override capability

## Architecture

### Detection Logic

The system will detect the test environment via the `NODE_ENV` environment variable:

```typescript
const isTest = process.env.NODE_ENV === 'test'
const dbPath = isTest ? ':memory:' : config.dbconfig.split('?')[0]
```

### Database Modes

| Environment | Database Type | Path | Journal Mode |
|-------------|---------------|------|--------------|
| Production | File-based | `./focalboard.db` | WAL |
| Development | File-based | `./focalboard.db` | WAL |
| Test | In-memory | `:memory:` | DELETE |

### Benefits

- **Speed:** In-memory databases are significantly faster (no disk I/O)
- **Isolation:** Each test run gets a fresh database automatically
- **Cleanup:** No need to delete test database files
- **Simplicity:** Transparent to test code - same API, different storage

## Implementation Details

### File: `src/backend/db/index.ts`

1. **Environment Detection:**
   - Check `process.env.NODE_ENV === 'test'`
   - Use `:memory:` if true, otherwise use configured file path

2. **Database Creation:**
   ```typescript
   const isTest = process.env.NODE_ENV === 'test'
   const dbPath = isTest ? ':memory:' : config.dbconfig.split('?')[0]
   const sqlite = new Database(dbPath, { create: true })
   ```

3. **Journal Mode Logic:**
   - Update condition to check for `:memory:` in addition to 'test.db'
   - In-memory databases use DELETE mode (WAL not applicable)
   - Production uses WAL for better concurrent access

4. **Logging:**
   - Add helpful log message indicating database mode
   - Aids in debugging test issues

### File: `playwright.config.ts`

Update `webServer` configuration:

```typescript
webServer: {
    command: 'NODE_ENV=test bun dev',
    url: 'http://localhost:8088',
    reuseExistingServer: false,
    env: {
        NODE_ENV: 'test',
    },
}
```

Remove the current `DB_CONFIG` environment variable (no longer needed).

### File: `package.json`

Update test scripts to set `NODE_ENV=test`:

```json
{
  "scripts": {
    "test:e2e": "NODE_ENV=test playwright test",
    "test:e2e:ui": "NODE_ENV=test playwright test --ui",
    "test:e2e:debug": "NODE_ENV=test playwright test --debug",
    "test": "NODE_ENV=test bun test"
  }
}
```

### File: `drizzle.config.ts`

No changes needed. Migration generation remains file-based for schema diffs.

## Migration & Seed Handling

### E2E Tests (Playwright)

- Global setup (`global-setup.ts`) runs migrations and seeds
- Executes at webServer startup with in-memory database
- Each test run gets fresh, fully-migrated database
- Seed data loads into memory automatically

### Unit Tests (Future)

- Each test file importing `db` gets its own in-memory instance
- Provide test helper: `await setupTestDatabase()` for test setup
- Run in beforeAll/beforeEach hooks as needed

### Seed Scripts

Existing seed scripts (`src/backend/db/seed.ts`) work unchanged:
- Use the same `db` export
- Automatically seed in-memory database when `NODE_ENV=test`
- Transparent to seed implementation

## Edge Cases & Error Handling

### Manual Database Inspection

Developers can override for debugging:
```bash
NODE_ENV=development bun test:e2e
```
This uses file-based database for post-test inspection.

### CI/CD Environments

- Test scripts explicitly set `NODE_ENV=test` in package.json
- Prevents CI systems' default `NODE_ENV=production` from affecting tests
- Ensures consistent test behavior across environments

### Migration Generation

- `drizzle-kit generate` uses file-based database (via drizzle.config.ts)
- Independent of `NODE_ENV` setting
- Developers run migrations against real files for accurate schema diffs

### Development Safety

- `bun dev` runs without `NODE_ENV=test`
- Development always uses file-based database
- No risk of accidental in-memory database in development
- Production deployments never set `NODE_ENV=test`

### Backwards Compatibility

The old pattern still works as fallback:
```bash
DB_CONFIG=focalboard-test.db bun test:e2e
```
Graceful migration path for existing test setups.

## Testing Strategy

### Verification Steps

1. Run E2E tests with `NODE_ENV=test` - should use in-memory
2. Run dev server normally - should use file-based
3. Verify no `focalboard-test.db` file created after tests
4. Check logs confirm correct database mode
5. Test override: `NODE_ENV=development bun test:e2e` creates file

### Success Criteria

- All existing E2E tests pass with in-memory database
- Tests run faster than before (benchmark)
- No test database files left after test runs
- Development and production modes unchanged
- Clear log messages indicate database mode

## Rollback Plan

If issues arise:
1. Revert changes to `src/backend/db/index.ts`
2. Restore `DB_CONFIG` in `playwright.config.ts`
3. File-based test database behavior restored

Low risk - changes are isolated to database initialization logic.

## Future Enhancements

- Add test helper utilities for common database operations
- Document debugging patterns for in-memory tests
- Consider transaction-based test isolation for unit tests
- Explore snapshot testing for database state
