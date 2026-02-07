# Focalboard Bun Server — Implementation Status

This document tracks the backend re-implementation from Go to Bun/Hono/Drizzle ORM/TypeScript.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Bun |
| Web Framework | Hono |
| ORM | Drizzle ORM (bun-sqlite) |
| Database | SQLite (WAL mode) |
| Auth | Better Auth (source of truth) + Bearer plugin |
| Language | TypeScript |

## Architecture

```
app/src/backend/
  index.ts              # Hono app factory (createApp)
  config.ts             # Env/config loader
  errors.ts             # Custom error classes
  auth/
    index.ts            # Better Auth setup (createAuth)
  db/
    schema.ts           # Drizzle schema (20 tables)
    index.ts            # DB connection
    migrate.ts          # Migration runner
    seed.ts             # Seed script
    migrations/         # Generated SQL
  middleware/
    auth.ts             # sessionRequired, attachSession
    csrf.ts             # X-Requested-With check
    error.ts            # app.onError handler
  routes/
    index.ts            # Route aggregator
    system.ts           # /hello, /ping, /clientConfig
    auth.ts             # /login, /logout, /register
    users.ts            # /users/*
    teams.ts            # /teams/*
    boards.ts           # /boards/*
    blocks.ts           # /boards/{boardID}/blocks/*
    cards.ts            # /cards/*, /boards/{boardID}/cards/*
    boards-and-blocks.ts # /boards-and-blocks
    members.ts          # /boards/{boardID}/members/*
    sharing.ts          # /boards/{boardID}/sharing
    categories.ts       # /teams/{teamID}/categories/*
    search.ts           # board search endpoints
    subscriptions.ts    # /subscriptions/*
    files.ts            # file upload/serve
    templates.ts        # /teams/{teamID}/templates
    content-blocks.ts   # /content-blocks/*/moveto
    compliance.ts       # /admin/*
    onboarding.ts       # /teams/{teamID}/onboard
    statistics.ts       # /statistics
    archives.ts         # archive import/export
  services/
    history.ts          # Block/board/member history recording
```

## Key Design Decisions

1. **Dependency Injection**: `createApp(deps)` and `createAuth(db)` factory functions. DB and Auth are injected via Hono context middleware (`c.get("db")`, `c.get("auth")`). This enables test isolation with in-memory SQLite.

2. **Better Auth as Source of Truth**: Auth owns `user`, `session`, `account`, `verification` tables. Focalboard extends users via a `user_profiles` table joined by `user_id`. Bearer plugin enables `Authorization: Bearer <token>` API auth.

3. **Error Handling**: Custom `AppError` subclasses (400, 401, 403, 404, 413, 501) caught by `app.onError()` — not middleware try/catch (Hono limitation).

4. **Soft Deletes**: All entity deletion sets `deleteAt` to timestamp. All list queries filter `deleteAt = 0`.

5. **History Tracking**: Board, block, and member mutations record snapshots to `*_history` tables via `services/history.ts`.

6. **Route Order**: Search routes registered before board routes to prevent `/boards/search` matching `/boards/:boardID`.

## Implementation Phases — Status

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Foundation (DB, config, server shell, middleware) | Done |
| 2 | Authentication (Better Auth, Bearer, session middleware) | Done |
| 3 | Core entities (Users, Teams, Boards) | Done |
| 4 | Blocks, Cards, Content Blocks, Boards-and-Blocks | Done |
| 5 | Membership, Sharing, Categories | Done |
| 6 | Search, Subscriptions, Files, Templates, Archives, Stats, Compliance | Done |
| 7 | History tables + data integrity | Done |
| 8 | Seed data + E2E validation | Done |

## API Endpoints Implemented (79 total)

### System (3)
- `GET /hello` — server greeting
- `GET /ping` — server metadata
- `GET /clientConfig` — client configuration

### Auth (5)
- `POST /login` — email/password login
- `POST /logout` — invalidate session
- `POST /register` — create account
- `POST /users/{userID}/changepassword` — change password
- `POST /teams/{teamID}/regenerate_signup_token` — admin token refresh

### Users (7)
- `GET /users/me` — current user
- `GET /users/me/memberships` — user's board memberships
- `GET /users/me/config` — user preferences
- `PUT /users/{userID}/config` — update preferences
- `GET /users/{userID}` — user by ID
- `POST /users` — batch get users by ID list
- `POST /teams/{teamID}/users` — team users by ID list

### Teams (4)
- `GET /teams` — list teams
- `GET /teams/{teamID}` — team by ID
- `GET /teams/{teamID}/users` — list team users
- `POST /teams/{teamID}/users` — team users by ID

### Boards (8)
- `GET /teams/{teamID}/boards` — list team boards
- `POST /boards` — create board
- `GET /boards/{boardID}` — get board (supports read_token)
- `PATCH /boards/{boardID}` — patch board
- `DELETE /boards/{boardID}` — soft delete
- `POST /boards/{boardID}/duplicate` — duplicate with blocks
- `POST /boards/{boardID}/undelete` — restore
- `GET /boards/{boardID}/metadata` — board metadata

### Blocks (7)
- `GET /boards/{boardID}/blocks` — list blocks (filterable)
- `POST /boards/{boardID}/blocks` — upsert blocks
- `PATCH /boards/{boardID}/blocks` — batch patch
- `DELETE /boards/{boardID}/blocks/{blockID}` — soft delete
- `PATCH /boards/{boardID}/blocks/{blockID}` — patch single
- `POST /boards/{boardID}/blocks/{blockID}/undelete` — restore
- `POST /boards/{boardID}/blocks/{blockID}/duplicate` — duplicate

### Cards (4)
- `GET /boards/{boardID}/cards` — list cards (paginated)
- `POST /boards/{boardID}/cards` — create card
- `GET /cards/{cardID}` — card by ID
- `PATCH /cards/{cardID}` — patch card

### Content Blocks (1)
- `POST /content-blocks/{blockID}/moveto/{where}/{dstBlockID}` — reorder

### Boards-and-Blocks (3)
- `POST /boards-and-blocks` — atomic create
- `PATCH /boards-and-blocks` — atomic patch
- `DELETE /boards-and-blocks` — atomic delete

### Members (6)
- `GET /boards/{boardID}/members` — list members
- `POST /boards/{boardID}/members` — add member
- `PUT /boards/{boardID}/members/{userID}` — update role
- `DELETE /boards/{boardID}/members/{userID}` — remove member
- `POST /boards/{boardID}/join` — self-join open board
- `POST /boards/{boardID}/leave` — self-leave

### Sharing (2)
- `GET /boards/{boardID}/sharing` — get sharing info
- `POST /boards/{boardID}/sharing` — set sharing

### Categories (9)
- `GET /teams/{teamID}/categories` — user categories
- `POST /teams/{teamID}/categories` — create category
- `PUT /teams/{teamID}/categories/reorder` — reorder
- `PUT /teams/{teamID}/categories/{categoryID}` — update
- `DELETE /teams/{teamID}/categories/{categoryID}` — delete
- `PUT /teams/{teamID}/categories/{categoryID}/boards/reorder` — reorder boards
- `POST /teams/{teamID}/categories/{categoryID}/boards/{boardID}` — assign board
- `PUT .../boards/{boardID}/hide` — hide board
- `PUT .../boards/{boardID}/unhide` — unhide board

### Search (5)
- `GET /boards/search` — search all boards
- `GET /teams/{teamID}/boards/search` — search team boards
- `GET /teams/{teamID}/boards/search/linkable` — search linkable boards
- `GET /teams/{teamID}/channels` — channels stub
- `GET /teams/{teamID}/channels/{channelID}` — channel stub

### Subscriptions (3)
- `POST /subscriptions` — create
- `DELETE /subscriptions/{blockID}/{subscriberID}` — delete
- `GET /subscriptions/{subscriberID}` — user subscriptions

### Files (3)
- `POST /teams/{teamID}/{boardID}/files` — upload
- `GET /files/teams/{teamID}/{boardID}/{filename}` — serve
- `GET /files/teams/{teamID}/{boardID}/{filename}/info` — metadata

### Templates (1)
- `GET /teams/{teamID}/templates` — list templates

### Onboarding (1)
- `POST /teams/{teamID}/onboard` — create welcome board

### Statistics (1)
- `GET /statistics` — board/card counts

### Archives (3)
- `GET /boards/{boardID}/archive/export` — export board
- `GET /teams/{teamID}/archive/export` — export team
- `POST /teams/{teamID}/archive/import` — import archive

### Compliance/Admin (4)
- `GET /admin/boards` — compliance board listing
- `GET /admin/boards_history` — board history
- `GET /admin/blocks_history` — block history
- `POST /admin/users/{username}/password` — admin set password

## Database Schema (20 tables)

**Better Auth tables (4):** `user`, `session`, `account`, `verification`

**Focalboard tables (16):** `user_profiles`, `blocks`, `blocks_history`, `boards`, `boards_history`, `board_members`, `board_members_history`, `categories`, `category_boards`, `subscriptions`, `notification_hints`, `sharing`, `file_info`, `preferences`, `teams`, `system_settings`

## Test Suite

96 tests across 15 files — all passing.

```
bun test
# 96 pass, 0 fail, 236 expect() calls (~1.2s)
```

| Test File | Tests | Coverage |
|-----------|-------|----------|
| system.test.ts | 8 | System routes, CSRF, error format |
| auth.test.ts | 8 | Register, login, invalid creds, password change |
| boards.test.ts | 9 | CRUD, duplicate, undelete, metadata |
| blocks.test.ts | 10 | CRUD, upsert, batch patch, undelete, duplicate |
| cards.test.ts | 6 | CRUD, pagination, field patching |
| boards-and-blocks.test.ts | 3 | Atomic create/patch/delete |
| members.test.ts | 7 | Add, update, remove, join, leave, private board rejection |
| sharing.test.ts | 3 | Enable/disable sharing |
| categories.test.ts | 8 | CRUD, reorder, board assignment, hide/unhide |
| search.test.ts | 5 | Search by term, team search, linkable, empty term |
| subscriptions.test.ts | 3 | Create, get, delete |
| statistics.test.ts | 1 | Board/card counts |
| compliance.test.ts | 5 | Admin boards, history, non-admin rejection |
| history.test.ts | 4 | Board/block/member history recording |
| e2e.test.ts | 15 | Full workflow smoke test |

## Running

```bash
cd app

# Development
bun dev

# Run tests
bun test

# Database operations
bun db:generate    # Generate migrations from schema
bun db:migrate     # Apply migrations
bun db:seed        # Seed with default data
```

## Seed Data

`bun db:seed` creates:
- Default team (ID: "0")
- Admin user (`admin@focalboard.local` / `admin123`)
- Welcome board with 3 sample cards
