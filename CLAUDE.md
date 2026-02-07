# CLAUDE.md - Focalboard

## Project Overview

Focalboard is an open source, self-hosted project management tool (alternative to Trello/Notion/Asana). This is a monorepo with three main components:

- **`webapp/`** - Legacy React 17 + Vite frontend (v8.0.0)
- **`server/`** - Go 1.21 backend with SQLite/PostgreSQL
- **`app/`** - New Bun-based refactor (Hono + Drizzle ORM + React 19)

## Active Refactoring

See `REFACTOR.md` for the modernization roadmap:

- **Phase 1 (active):** Replace Go backend with Bun/Hono/Drizzle ORM + Better Auth + SQLite
- **Phase 2 (planned):** Modernize frontend with React 19, Tailwind CSS, TanStack Query/Router

## Build & Run Commands

### Webapp (legacy)

```sh
cd webapp
npm install              # install dependencies
npm run dev              # vite dev server (port 9006, proxies API to :8000)
npm run build            # production build → pack/
npm run test             # jest unit tests
npm run check            # eslint + stylelint
npm run fix              # auto-fix lint issues
npm run cypress:ci       # e2e tests (requires server on :8088)
```

### Server (Go)

```sh
make prebuild            # install deps + generate
make server              # build Go binary
./bin/focalboard-server  # run on port 8000
make server-test         # run Go tests (SQLite)
make server-lint         # golangci-lint
make ci                  # full CI pipeline
```

### App (new Bun refactor)

```sh
cd app
bun install              # install dependencies
bun dev                  # dev server with hot reload
bun start                # production server
bun run build.ts         # build with Tailwind plugin
bun test                 # run tests
```

### Full Project

```sh
make all                 # build server + webapp
make watch               # live reload (server + webapp via modd)
make clean               # remove build artifacts
```

## Code Style & Conventions

### TypeScript/JavaScript

- **Indentation:** 4 spaces
- **Semicolons:** none
- **Quotes:** single quotes preferred
- **Naming:** camelCase for variables/functions, PascalCase for components/types
- **Import order:** builtin → external → internal (enforced by ESLint)
- **No z-index** in stylesheets (enforced by stylelint)
- **Max nesting depth:** 4 (SCSS), 5 (callbacks)

### Go

- **Linter:** golangci-lint with 50+ linters
- **Line length:** 180 chars max
- **Build tags:** `json1 sqlite3`
- **Race detector:** enabled in tests (except Windows)

### Git Commits

Follow conventional commits:

```
feat: add new board template
fix: resolve card drag-drop issue
chore: update dependencies
refactor: extract board utilities
```

## Architecture Notes

### Webapp (`webapp/`)

- React 17 with TypeScript 4.6
- Vite for bundling (migrated from Webpack)
- Jest + SWC for unit tests, Cypress for E2E
- SCSS with stylelint (sass-guidelines)
- Redux for state management
- i18n support built in

### Server (`server/`)

- Go 1.21 with Gorilla Mux router
- SQLite (default) and PostgreSQL support
- WebSocket support for real-time updates
- Swagger/OpenAPI documentation
- Multi-database test suite (SQLite, MySQL, MariaDB, Postgres via Docker)

### App (`app/`)

- Bun runtime — use `bun` instead of `node`/`npm`
- Hono web framework
- Drizzle ORM with SQLite
- Better Auth (GitHub, Google, Email/Password, Magic Link)
- React 19 + Tailwind CSS
- See `app/CLAUDE.md` for Bun-specific guidelines

## Configuration

- **Server config:** `config.json` (port 8000, SQLite default)
- **App config:** `app-config.json` (port 8088, SQLite)
- **Node version:** 20.11 (see `.nvmrc`)
- **Environment:** Create `.env` with `EXCLUDE_ENTERPRISE="1"` for local dev

## Testing

- **Webapp unit tests:** `cd webapp && npm test` (Jest + @testing-library/react)
- **Webapp E2E:** `cd webapp && npm run cypress:ci` (needs server on :8088)
- **Server tests:** `make server-test` (Go test with race detector)
- **App tests:** `cd app && bun test`
- Always run `make ci` before submitting PRs
