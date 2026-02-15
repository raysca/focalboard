---
description: Use Bun instead of Node.js, npm, pnpm, or vite.
globs: "*.ts, *.tsx, *.html, *.css, *.js, *.jsx, package.json"
alwaysApply: false
---

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Use `bunx <package> <command>` instead of `npx <package> <command>`
- Bun automatically loads .env, so don't use dotenv.

## APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Testing

Use `bun test` to run tests.

```ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

## E2E Testing

Playwright is used for browser-based end-to-end testing. Tests validate real user workflows across Chrome, Firefox, and Safari.

**Database Configuration:**
- Tests automatically use in-memory SQLite (`:memory:`) when `NODE_ENV=test`
- Migrations and seeding run automatically before tests start
- No test database files are created or need cleanup
- Each test run gets a fresh, isolated database

### Running E2E Tests

Tests are fully automated - just run them:

```sh
cd app
bun test:e2e          # Run all tests (headless, in-memory)
```

The test setup automatically:
1. Detects `NODE_ENV=test` from playwright.config.ts
2. Creates an in-memory database
3. Runs migrations
4. Seeds test data
5. Executes tests

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

### Test Structure

Tests are located in `tests/e2e/` with Page Object Models for maintainability:

```
tests/e2e/
├── auth.spec.ts              # Authentication tests
├── boards.spec.ts            # Board CRUD operations
├── cards.spec.ts             # Card management
├── admin.spec.ts             # Admin settings
└── fixtures/
    ├── auth.fixture.ts       # Authenticated contexts
    └── pages/                # Page Object Models
        ├── LoginPage.ts
        ├── DashboardPage.ts
        ├── BoardPage.ts
        └── AdminPage.ts
```

### Test Credentials

From seed data (`src/backend/db/seeds/users.json`):
- **Admin:** `alice@focalboard.dev` / `demo1234`
- **Regular User:** `bob@focalboard.dev` / `demo1234`

### Accessible Selectors

Tests use accessible selectors (getByRole, getByPlaceholder, getByText) instead of data-testid attributes for more robust, user-centric testing.

See `E2E_TESTS_FINAL_STATUS.md` for current test status and implementation details.

## Frontend

Use HTML imports with `Bun.serve()`. Don't use `vite`. HTML imports fully support React, CSS, Tailwind.

Server:

```ts#index.ts
import index from "./index.html"

Bun.serve({
  routes: {
    "/": index,
    "/api/users/:id": {
      GET: (req) => {
        return new Response(JSON.stringify({ id: req.params.id }));
      },
    },
  },
  // optional websocket support
  websocket: {
    open: (ws) => {
      ws.send("Hello, world!");
    },
    message: (ws, message) => {
      ws.send(message);
    },
    close: (ws) => {
      // handle close
    }
  },
  development: {
    hmr: true,
    console: true,
  }
})
```

HTML files can import .tsx, .jsx or .js files directly and Bun's bundler will transpile & bundle automatically. `<link>` tags can point to stylesheets and Bun's CSS bundler will bundle.

```html#index.html
<html>
  <body>
    <h1>Hello, world!</h1>
    <script type="module" src="./frontend.tsx"></script>
  </body>
</html>
```

With the following `frontend.tsx`:

```tsx#frontend.tsx
import React from "react";
import { createRoot } from "react-dom/client";

// import .css files directly and it works
import './index.css';

const root = createRoot(document.body);

export default function Frontend() {
  return <h1>Hello, world!</h1>;
}

root.render(<Frontend />);
```

Then, run index.ts

```sh
bun --hot ./index.ts
```

For more information, read the Bun API docs in `node_modules/bun-types/docs/**.mdx`.
