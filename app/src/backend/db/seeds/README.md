# Seed Data Files

This directory contains JSON files used to seed the Focalboard database with software-themed demo data.

## Overview

The seed script (`../seed.ts`) loads data from these JSON files to create a complete demo environment with multiple teams, users, boards, and realistic software development workflows.

## File Structure

### `users.json`
Defines 6 demo users with different roles:
- **Alice Chen** - System Admin, Project Lead
- **Bob Smith** - Backend Developer
- **Carol Johnson** - Frontend Developer
- **Dave Martinez** - DevOps Engineer
- **Eve Williams** - UI/UX Designer
- **Frank Brown** - QA Engineer

All users have the password: `demo1234`

**Password Compatibility:** Passwords are hashed using **scrypt** (NOT bcrypt) via Better Auth's `hashPassword` function. Hash format is `salt:key` (hex-encoded) which is fully compatible with Better Auth's authentication system. The seed script automatically verifies password compatibility after seeding.

### `teams.json`
Defines 3 teams:
- **Default Team** - General purpose team
- **Engineering Team** - For development boards
- **Design Team** - For design and UI boards

### `boards.json`
Defines 4 software-themed boards:
1. **Product Launch 🚀** - Overall product launch tracking
2. **API Development 🔌** - Backend API endpoints
3. **UI Component Library 🎨** - Design system components
4. **Sprint 23 - Q1 2024 🏃** - Sprint planning board

Each board has custom card properties (status, priority, assignee, etc.)

### `cards.json`
Contains 25 realistic software development cards distributed across all boards:
- OAuth authentication implementation
- Database schema design
- CI/CD pipeline setup
- API endpoint development
- UI component creation
- Performance optimization
- Security audits

### `views.json`
Defines 9 different views across boards:
- Board views (Kanban-style)
- Table views (spreadsheet-style)
- Calendar/Timeline views
- Gallery views

### `boardMembers.json`
Maps users to boards with appropriate permissions:
- Admins (full control)
- Editors (can edit content)
- Commenters (can comment)
- Viewers (read-only)

### `dependencies.json`
Creates 19 card dependency relationships:
- **Blocking dependencies** - Task A must complete before B can start
- **Related dependencies** - Tasks that are connected but not blocking

Examples:
- "Design database schema" blocks "Build authentication flow"
- "Build authentication flow" blocks "Implement payment integration"

### `categories.json`
Defines 6 user-specific board categories:
- Alice: "⭐ Favorites", "🏢 Work in Progress"
- Bob: "⚙️ Backend Projects"
- Carol: "🎨 Frontend Work"
- Dave: "🚀 Infrastructure & DevOps"
- Eve: "✨ Design System"

### `subscriptions.json`
Sets up notification subscriptions for users on specific cards and boards they're interested in.

## Data Relationships

```
Teams
  └── Boards
       ├── Board Members (users with permissions)
       ├── Cards (tasks/items)
       │    └── Dependencies (relationships between cards)
       └── Views (different ways to display cards)

Users
  ├── User Profiles
  ├── Categories (personalized board organization)
  └── Subscriptions (notification preferences)
```

## Customizing Seed Data

To customize the seed data:

1. **Add new users**: Edit `users.json` and add a new user object
2. **Create boards**: Add to `boards.json` with card properties
3. **Add cards**: Create entries in `cards.json` with proper property values
4. **Set up views**: Define views in `views.json` for your boards
5. **Connect cards**: Add dependencies in `dependencies.json`

## Property IDs

Card properties use consistent IDs across the JSON files:

### Product Launch Board
- `prop-status`: Status (To Do, In Progress, In Review, Done)
- `prop-priority`: Priority (Critical, High, Medium, Low)
- `prop-assignee`: Assignee (person selector)
- `prop-due-date`: Due Date (date picker)
- `prop-estimate`: Story Points (number)

### API Development Board
- `prop-api-status`: Status (Backlog, Design, Development, Testing, Deployed)
- `prop-api-method`: HTTP Method (GET, POST, PUT, DELETE)
- `prop-api-assignee`: Assignee

### UI Components Board
- `prop-ui-status`: Status (Ideation, Design, Development, Complete)
- `prop-ui-component-type`: Component Type (Atom, Molecule, Organism)
- `prop-ui-assignee`: Assignee

### Sprint Planning Board
- `prop-sprint-status`: Status (To Do, In Progress, Blocked, Done)
- `prop-sprint-points`: Story Points (number)
- `prop-sprint-assignee`: Assignee

## Running the Seed Script

### Normal Mode (Idempotent)
Skips existing data and only creates missing records:

```bash
cd app
bun src/backend/db/seed.ts
```

### Force Reload Mode
Clears ALL database data and reseeds from scratch:

```bash
cd app
bun src/backend/db/seed.ts --force
```

⚠️ **Warning**: Force mode will delete all existing data including any custom data you've created!

### What the Script Does

1. Run database migrations
2. **(Force mode only)** Clear all existing data from all tables
3. Load all JSON files
4. Create teams, users, boards, cards, and relationships
5. Skip existing data (normal mode) or insert all fresh (force mode)
6. Display a detailed summary of what was created/cleared

## Software Development Theme

The seed data simulates a realistic software development environment:

- **Product Launch**: High-level feature development
- **API Development**: RESTful endpoint implementation
- **UI Components**: Design system and component library
- **Sprint Planning**: Agile sprint execution

Cards include realistic tasks like:
- OAuth 2.0 authentication
- Stripe payment integration
- WebSocket real-time sync
- CI/CD pipeline setup
- E2E testing with Playwright
- Sentry error monitoring

This provides an excellent demo environment for evaluating Focalboard's capabilities in a software development context.
