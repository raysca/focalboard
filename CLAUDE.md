# CLAUDE.md - Focalboard

## Project Overview

Focalboard is an open source, self-hosted project management tool (alternative to Trello/Notion/Asana).

**⚠️ IMPORTANT: This is an active migration project.**

- **`app/`** - **Primary development target** - Modern fullstack Bun implementation (Hono + Drizzle ORM + React 19)
- **`webapp/`** - **DEPRECATED** - Legacy React 17 + Vite frontend (being migrated to `app/`)
- **`server/`** - **DEPRECATED** - Legacy Go 1.21 backend (being replaced by `app/`)

**All new development should happen in `app/`. The `webapp/` and `server/` directories are maintained only for reference during migration.**

## Active Migration

See `REFACTOR.md` for the modernization roadmap. This project is migrating from a split Go backend + React frontend to a unified modern fullstack TypeScript application:

- **Phase 1 (active):** Migrating Go backend to Bun/Hono/Drizzle ORM + Better Auth + SQLite
- **Phase 2 (active):** Migrating React 17 frontend to React 19, Tailwind CSS, TanStack Query/Router

## Build & Run Commands

### App (Primary - Modern Bun Stack)

**Use these commands for active development:**

```sh
cd app
bun install              # install dependencies
bun dev                  # dev server with hot reload (port 8088)
bun start                # production server
bun run build.ts         # build with Tailwind plugin
bun test                 # run tests
```

### Deprecated Legacy Commands

**⚠️ The following are maintained only for reference during migration. Do not use for new development.**

<details>
<summary>Webapp (DEPRECATED - legacy React 17 frontend)</summary>

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
</details>

<details>
<summary>Server (DEPRECATED - legacy Go backend)</summary>

```sh
make prebuild            # install deps + generate
make server              # build Go binary
./bin/focalboard-server  # run on port 8000
make server-test         # run Go tests (SQLite)
make server-lint         # golangci-lint
make ci                  # full CI pipeline
```
</details>

<details>
<summary>Full Project (DEPRECATED - legacy build system)</summary>

```sh
make all                 # build server + webapp
make watch               # live reload (server + webapp via modd)
make clean               # remove build artifacts
```
</details>

## Code Style & Conventions

### TypeScript/JavaScript (Active - for `app/`)

- **Indentation:** 4 spaces
- **Semicolons:** none
- **Quotes:** single quotes preferred
- **Naming:** camelCase for variables/functions, PascalCase for components/types
- **Import order:** builtin → external → internal (enforced by ESLint)
- **Tailwind CSS:** Use utility classes, avoid custom CSS where possible
- **Max nesting depth:** Keep component nesting shallow

### Go (DEPRECATED - legacy `server/` only)

- **Linter:** golangci-lint with 50+ linters
- **Line length:** 180 chars max
- **Build tags:** `json1 sqlite3`
- **Race detector:** enabled in tests (except Windows)
- **Note:** Do not add new Go code - migrate to TypeScript in `app/`

### Git Commits

Follow conventional commits:

```
feat: add new board template
fix: resolve card drag-drop issue
chore: update dependencies
refactor: extract board utilities
```

## Architecture Notes

### App (`app/`) - **PRIMARY CODEBASE**

**Modern fullstack TypeScript application - all new development happens here:**

#### Runtime & Build System
- **Bun:** Latest stable runtime (use `bun` instead of `node`/`npm`)
- **Hot reload:** `bun --hot` for development with instant updates
- **HTML imports:** Direct import of `.html`, `.tsx`, `.css` in server code
- **Automatic bundling:** No need for Webpack/Vite - Bun handles transpilation and bundling
- **Environment:** `.env` automatically loaded (no dotenv package needed)

#### Backend Stack
- **Framework:** Hono 4.x - lightweight web framework
- **Database:** Drizzle ORM 0.45.x with SQLite
- **Schema:** Type-safe schema in `src/backend/db/schema.ts`
- **Migrations:** `bun db:generate` and `bun db:migrate`
- **Auth:** Better Auth 1.4.x (GitHub, Google, Email/Password, Magic Link)
- **Validation:** Zod 4.x for request/response validation
- **Testing:** `bun test` with built-in test runner

#### Frontend Stack
- **UI Framework:** React 19 with TypeScript
- **Styling:** Tailwind CSS 4.x with utility-first approach
- **Routing:** TanStack Router 1.x for type-safe routing
- **State Management:** TanStack Query 5.x for server state
- **Drag & Drop:** @dnd-kit for board interactions
- **Icons:** Lucide React for consistent iconography
- **Utilities:** clsx + tailwind-merge for className composition

#### Project Structure
```
app/
├── src/
│   ├── backend/         # Server-side code
│   │   ├── db/          # Drizzle schema, migrations, seed
│   │   ├── routes/      # API route handlers
│   │   ├── services/    # Business logic
│   │   ├── repositories/# Data access layer
│   │   ├── middleware/  # Auth, CSRF, error handling
│   │   └── validation/  # Zod schemas
│   ├── frontend/        # Client-side code
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── api/         # API client functions
│   │   └── lib/         # Utilities
│   ├── index.ts         # Server entry point (Hono app)
│   └── frontend.tsx     # Client entry point (React root)
├── build.ts             # Custom build script with Tailwind
├── drizzle.config.ts    # Drizzle ORM configuration
└── package.json         # Dependencies and scripts
```

See `app/CLAUDE.md` for detailed Bun-specific guidelines

### Webapp (`webapp/`) - **DEPRECATED**

**⚠️ Legacy frontend - being migrated to `app/`. Do not modify.**

- React 17 with TypeScript 4.6
- Vite for bundling (migrated from Webpack)
- Jest + SWC for unit tests, Cypress for E2E
- SCSS with stylelint (sass-guidelines)
- Redux for state management
- i18n support built in

### Server (`server/`) - **DEPRECATED**

**⚠️ Legacy backend - being replaced by `app/`. Do not modify.**

- Go 1.21 with Gorilla Mux router
- SQLite (default) and PostgreSQL support
- WebSocket support for real-time updates
- Swagger/OpenAPI documentation
- Multi-database test suite (SQLite, MySQL, MariaDB, Postgres via Docker)

## Configuration

### Active (for `app/`)

- **App config:** `app/app-config.json` (port 8088, SQLite)
- **Environment:** Create `app/.env` for local development
- **Bun version:** Latest stable (see `app/package.json`)

### Legacy (DEPRECATED)

- **Server config:** `config.json` (port 8000, SQLite default) - DEPRECATED
- **Node version:** 20.11 (see `.nvmrc`) - DEPRECATED, use Bun instead
- **Environment:** `.env` with `EXCLUDE_ENTERPRISE="1"` - DEPRECATED

## Testing

### Active Development

- **App tests:** `cd app && bun test`
- Test new features in `app/` using Bun's test runner

### Legacy (DEPRECATED)

- **Webapp unit tests:** `cd webapp && npm test` (Jest + @testing-library/react) - DEPRECATED
- **Webapp E2E:** `cd webapp && npm run cypress:ci` (needs server on :8088) - DEPRECATED
- **Server tests:** `make server-test` (Go test with race detector) - DEPRECATED
- **CI:** `make ci` - DEPRECATED (for legacy code only)
