# Onboarding Tour Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the onboarding tour by creating sample cards on the backend and displaying interactive tour popovers on the frontend.

**Architecture:** Backend creates 3 sample cards with Status/Priority properties when creating onboarding board. Frontend detects onboarding board by title, activates TourContext, and renders TourStepManager component to display floating tour popovers.

**Tech Stack:** Bun, Drizzle ORM, React 19, TanStack Router, TanStack Query, existing TourContext infrastructure

---

## Task 1: Backend - Create Sample Cards and Properties

**Files:**
- Modify: `app/src/backend/routes/onboarding.ts`
- Reference: `app/src/backend/db/schema.ts` (to understand blocks schema)

**Step 1: Read the blocks schema**

Check how cards and properties are structured in the database.

```bash
# Read the schema file to understand the data model
cat app/src/backend/db/schema.ts | grep -A 20 "blocks\|properties"
```

Expected: See block types (card, board, view, text) and property structure

**Step 2: Extend onboarding route to create board view**

Modify `app/src/backend/routes/onboarding.ts` to create a default board view with a single group.

```typescript
// After creating the board, add:
const boardViewId = crypto.randomUUID();
const groupId = crypto.randomUUID();

// Create default board view
db.insert(blocks)
  .values({
    id: boardViewId,
    boardId,
    parentId: boardId,
    type: 'view',
    title: 'Board view',
    fields: JSON.stringify({
      viewType: 'board',
      sortOptions: [],
      groupById: 'status',
      hiddenOptionIds: [],
      cardOrder: [],
      columnWidths: {},
      filter: {},
      visiblePropertyIds: ['status', 'priority'],
    }),
    createAt: now,
    updateAt: now,
    deleteAt: 0,
  })
  .run();

// Create group for cards
db.insert(blocks)
  .values({
    id: groupId,
    boardId,
    parentId: boardViewId,
    type: 'text',
    title: 'Getting Started',
    fields: JSON.stringify({}),
    createAt: now,
    updateAt: now,
    deleteAt: 0,
  })
  .run();
```

**Step 3: Create Status property**

Add Status property with 3 options.

```typescript
const statusPropertyId = 'status';
const statusOptions = [
  { id: 'todo', value: 'To Do', color: 'propColorGray' },
  { id: 'inprogress', value: 'In Progress', color: 'propColorBlue' },
  { id: 'done', value: 'Done', color: 'propColorGreen' },
];

db.insert(blocks)
  .values({
    id: statusPropertyId,
    boardId,
    parentId: boardId,
    type: 'text',
    title: 'Status',
    fields: JSON.stringify({
      type: 'select',
      options: statusOptions,
    }),
    createAt: now,
    updateAt: now,
    deleteAt: 0,
  })
  .run();
```

**Step 4: Create Priority property**

Add Priority property with 3 options.

```typescript
const priorityPropertyId = 'priority';
const priorityOptions = [
  { id: 'low', value: 'Low', color: 'propColorGray' },
  { id: 'medium', value: 'Medium', color: 'propColorYellow' },
  { id: 'high', value: 'High', color: 'propColorRed' },
];

db.insert(blocks)
  .values({
    id: priorityPropertyId,
    boardId,
    parentId: boardId,
    type: 'text',
    title: 'Priority',
    fields: JSON.stringify({
      type: 'select',
      options: priorityOptions,
    }),
    createAt: now,
    updateAt: now,
    deleteAt: 0,
  })
  .run();
```

**Step 5: Create "Getting Started" card**

```typescript
const card1Id = crypto.randomUUID();

db.insert(blocks)
  .values({
    id: card1Id,
    boardId,
    parentId: groupId,
    type: 'card',
    title: 'Getting Started',
    fields: JSON.stringify({
      icon: '🚀',
      properties: {
        status: 'todo',
        priority: 'high',
      },
      contentOrder: [],
    }),
    createAt: now,
    updateAt: now,
    deleteAt: 0,
  })
  .run();

// Add description
db.insert(blocks)
  .values({
    id: crypto.randomUUID(),
    boardId,
    parentId: card1Id,
    type: 'text',
    title: '',
    fields: JSON.stringify({
      value: 'Welcome to Focalboard! This card will help you learn the basics. Click on cards to open them and see properties, comments, and descriptions. Try editing this card to get started.',
    }),
    createAt: now,
    updateAt: now,
    deleteAt: 0,
  })
  .run();
```

**Step 6: Create "Explore Views" card**

```typescript
const card2Id = crypto.randomUUID();

db.insert(blocks)
  .values({
    id: card2Id,
    boardId,
    parentId: groupId,
    type: 'card',
    title: 'Explore Views',
    fields: JSON.stringify({
      icon: '👀',
      properties: {
        status: 'inprogress',
        priority: 'medium',
      },
      contentOrder: [],
    }),
    createAt: now,
    updateAt: now,
    deleteAt: 0,
  })
  .run();

// Add description
db.insert(blocks)
  .values({
    id: crypto.randomUUID(),
    boardId,
    parentId: card2Id,
    type: 'text',
    title: '',
    fields: JSON.stringify({
      value: 'Focalboard supports multiple view types: Board (kanban), Table, Gallery, and Calendar. Each view shows your cards differently. Try creating a new view to see your cards in a table format.',
    }),
    createAt: now,
    updateAt: now,
    deleteAt: 0,
  })
  .run();
```

**Step 7: Create "Share & Collaborate" card**

```typescript
const card3Id = crypto.randomUUID();

db.insert(blocks)
  .values({
    id: card3Id,
    boardId,
    parentId: groupId,
    type: 'card',
    title: 'Share & Collaborate',
    fields: JSON.stringify({
      icon: '👥',
      properties: {
        status: 'todo',
        priority: 'low',
      },
      contentOrder: [],
    }),
    createAt: now,
    updateAt: now,
    deleteAt: 0,
  })
  .run();

// Add description
db.insert(blocks)
  .values({
    id: crypto.randomUUID(),
    boardId,
    parentId: card3Id,
    type: 'text',
    title: '',
    fields: JSON.stringify({
      value: 'Collaborate with your team by sharing boards. Click the share button to invite team members, set permissions, and work together in real-time. Comments and @mentions keep everyone in sync.',
    }),
    createAt: now,
    updateAt: now,
    deleteAt: 0,
  })
  .run();
```

**Step 8: Test backend changes**

Start the dev server and test the onboarding endpoint.

```bash
bun dev
```

In another terminal:
```bash
# Login and get session cookie first, then:
curl -X POST http://localhost:8088/api/teams/0/onboard \
  -H "Cookie: session=..." \
  -v
```

Expected: Returns `{teamID: "0", boardID: "uuid"}`, check database has 3 cards

**Step 9: Commit backend changes**

```bash
git add app/src/backend/routes/onboarding.ts
git commit -m "feat: create sample cards and properties for onboarding board

- Add board view with 'Getting Started' group
- Create Status property (To Do, In Progress, Done)
- Create Priority property (Low, Medium, High)
- Create 3 sample cards with rich descriptions:
  - Getting Started (Status: To Do, Priority: High)
  - Explore Views (Status: In Progress, Priority: Medium)
  - Share & Collaborate (Status: To Do, Priority: Low)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Frontend - Detect Onboarding Board and Activate Tour

**Files:**
- Modify: `app/src/frontend/routes/_auth.board.$boardId.tsx`
- Reference: `app/src/frontend/contexts/TourContext.tsx`

**Step 1: Read current board component**

Check how the board page is structured.

```bash
cat app/src/frontend/routes/_auth.board.$boardId.tsx | head -50
```

Expected: See how board data is loaded, component structure

**Step 2: Import TourContext**

Add import at the top of `_auth.board.$boardId.tsx`:

```typescript
import {useTourContext} from '../contexts/TourContext'
```

**Step 3: Add tour detection logic**

Inside the board component function, add:

```typescript
const {setOnboardingBoard} = useTourContext()
const {data: board} = useBoardQuery(boardId) // Assuming this hook exists

// Detect onboarding board and activate tour context
useEffect(() => {
  if (board?.title === 'Welcome to Focalboard!') {
    setOnboardingBoard(true)
  } else {
    setOnboardingBoard(false)
  }

  // Cleanup when component unmounts or board changes
  return () => {
    setOnboardingBoard(false)
  }
}, [board?.title, setOnboardingBoard])
```

**Step 4: Verify TourProvider is in component tree**

Check that TourProvider wraps the app in `App.tsx`:

```bash
grep -n "TourProvider" app/src/frontend/App.tsx
```

If not found, add it:

```typescript
import {TourProvider} from './contexts/TourContext'

// Wrap the router with TourProvider
<TourProvider>
  <RouterProvider router={router} />
</TourProvider>
```

**Step 5: Test tour detection**

```bash
bun dev
```

Open browser dev console and navigate to onboarding board. Check React DevTools for TourContext state showing `isOnboardingBoard: true`.

**Step 6: Commit tour detection**

```bash
git add app/src/frontend/routes/_auth.board.$boardId.tsx
git commit -m "feat: detect onboarding board and activate tour context

- Import useTourContext hook
- Check if board title is 'Welcome to Focalboard!'
- Set isOnboardingBoard flag in TourContext
- Cleanup flag when component unmounts

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Frontend - Render TourStepManager Component

**Files:**
- Modify: `app/src/frontend/routes/_auth.board.$boardId.tsx`
- Verify: `app/src/frontend/components/onboarding/TourStepManager.tsx` exists

**Step 1: Verify TourStepManager exists**

```bash
cat app/src/frontend/components/onboarding/TourStepManager.tsx | head -30
```

Expected: Component that renders tour popover when tour is active

**Step 2: Import TourStepManager**

Add to imports in `_auth.board.$boardId.tsx`:

```typescript
import {TourStepManager} from '../components/onboarding/TourStepManager'
```

**Step 3: Render TourStepManager in board component**

Add TourStepManager to the JSX, typically near the end of the main container:

```typescript
return (
  <div className="board-page">
    {/* Existing board content */}

    {/* Tour overlay - renders when tour is active */}
    <TourStepManager />
  </div>
)
```

**Step 4: Test tour popover display**

```bash
bun dev
```

Navigate to onboarding board. You should see a floating popover appear in the bottom-right corner with tour step content.

Expected: Popover shows "Open a Card" title and content about clicking "Getting Started" card.

**Step 5: Commit TourStepManager rendering**

```bash
git add app/src/frontend/routes/_auth.board.$boardId.tsx
git commit -m "feat: render TourStepManager on onboarding board

- Import TourStepManager component
- Render as overlay in board page
- Shows floating popover when tour is active

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Frontend - Add Tour Target Attributes to Cards

**Files:**
- Modify: Card rendering component (likely in `app/src/frontend/components/board/` or similar)
- Need to find where cards are rendered in kanban view

**Step 1: Find card rendering component**

```bash
find app/src/frontend/components -name "*Card*" -o -name "*card*" | head -10
```

Check each file to find where individual cards are rendered in the board view.

**Step 2: Add data-tour-target attribute conditionally**

In the card component, import TourContext:

```typescript
import {useTourContext} from '../../contexts/TourContext'
```

Inside the card component:

```typescript
const {isOnboardingBoard} = useTourContext()

// In the JSX where card is rendered:
<div
  className="card"
  data-tour-target={isOnboardingBoard ? `onboarding-card-${cardIndex}` : undefined}
  onClick={handleCardClick}
>
  {/* Card content */}
</div>
```

Note: You'll need to determine the card index. This might come from props or the card's position in the array.

**Step 3: Wire up tour advancement on card click**

In the card click handler:

```typescript
const {advanceTour, tourCategory} = useTourContext()

const handleCardClick = () => {
  // Advance tour if on first onboarding step
  if (isOnboardingBoard && tourCategory === 'onboarding') {
    advanceTour()
  }

  // Continue with normal card opening logic
  openCard(cardId)
}
```

**Step 4: Test tour advancement**

```bash
bun dev
```

Navigate to onboarding board, see tour popover. Click "Getting Started" card. Tour should advance to next category (card).

**Step 5: Commit tour target attributes**

```bash
git add app/src/frontend/components/board/[CardComponent].tsx
git commit -m "feat: add tour target attributes and advancement to cards

- Add data-tour-target attribute when on onboarding board
- Wire up advanceTour() when card clicked during onboarding
- Tour progresses from onboarding -> card category

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Verification - Run E2E Tests

**Files:**
- Test: `app/tests/e2e/onboarding.spec.ts`

**Step 1: Run all onboarding e2e tests**

```bash
bun test:e2e tests/e2e/onboarding.spec.ts
```

Expected output:
```
Running 24 tests using 3 workers

✓ [chromium] › onboarding.spec.ts:7 › first-time user sees welcome page
✓ [chromium] › onboarding.spec.ts:20 › welcome page displays correctly
✓ [chromium] › onboarding.spec.ts:40 › "Take a tour" creates board
✓ [chromium] › onboarding.spec.ts:63 › "No thanks" skips tour
✓ [chromium] › onboarding.spec.ts:80 › tour advances when user clicks card
✓ [chromium] › onboarding.spec.ts:103 › tour can be skipped
✓ [chromium] › onboarding.spec.ts:125 › onboarding board has sample cards
✓ [chromium] › onboarding.spec.ts:142 › existing user bypasses welcome

[Same for firefox and webkit]

24 passed (12s)
```

**Step 2: If tests fail, check specific failures**

```bash
# Run just the failing test
bun test:e2e tests/e2e/onboarding.spec.ts --grep="test name"

# Check screenshots in test-results/ directory
ls -la test-results/
```

**Step 3: Verify build still succeeds**

```bash
bun run build.ts
```

Expected: `✅ Build completed in ~250ms` with no errors

**Step 4: Run full test suite to check for regressions**

```bash
bun test:e2e
```

Expected: All existing tests still pass, onboarding tests now pass too

**Step 5: Final commit if any fixes needed**

```bash
git add [any additional files]
git commit -m "fix: address e2e test failures

[Describe any fixes made]

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Documentation Update

**Files:**
- Create/Update: `app/docs/ONBOARDING.md` (if it exists) or add section to main README

**Step 1: Document onboarding feature**

Create documentation explaining the onboarding flow for developers:

```markdown
# Onboarding Tour

## Overview

New users are greeted with a welcome page that offers an interactive tour of Focalboard features.

## Flow

1. User registers/logs in for the first time
2. Welcome page displays with "Take a tour" and "No thanks" options
3. Clicking "Take a tour":
   - Creates "Welcome to Focalboard!" board
   - Adds 3 sample cards with descriptions and properties
   - Starts guided tour with floating popovers
4. Tour progresses through 4 categories:
   - **Onboarding** (1 step): Open a card
   - **Card** (3 steps): Properties, Comments, Description
   - **Board** (3 steps): Views, Copy link, Share
   - **Sidebar** (3 steps): Navigation, Categories, Search

## Tour State

Stored in user preferences:
- `onboarding.tourStarted`: "1" when active
- `onboarding.tourCategory`: Current category
- `onboarding.tourStep`: Current step (999 = finished)

## Components

- `TourContext`: State management
- `TourStepManager`: Renders floating popover
- `TourPopover`: UI component for tour steps
- `tourSteps.ts`: Step definitions

## Sample Board Structure

The onboarding board includes:
- 3 cards: "Getting Started", "Explore Views", "Share & Collaborate"
- Status property: To Do, In Progress, Done
- Priority property: Low, Medium, High
- Rich descriptions explaining features
```

**Step 2: Commit documentation**

```bash
git add app/docs/ONBOARDING.md
git commit -m "docs: add onboarding tour documentation

- Explain tour flow and architecture
- Document tour state management
- List sample board structure
- Reference key components

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Success Criteria

✅ Backend creates 3 sample cards when onboarding board is created
✅ Sample cards have Status and Priority properties
✅ Frontend detects onboarding board by title
✅ TourStepManager renders floating popover when tour active
✅ Cards have data-tour-target attributes on onboarding board
✅ Clicking "Getting Started" card advances tour
✅ "Skip tour" button dismisses tour
✅ All 24 onboarding e2e tests pass (8 tests × 3 browsers)
✅ Build succeeds with no TypeScript errors
✅ No console errors during tour flow

## Notes

- If card rendering is in multiple places (table view, gallery view), only add tour targets to kanban/board view
- Tour only needs to work in the default board view, not in table/gallery/calendar views
- Sample cards are real data - users can edit/delete them
- Tour state persists in user preferences across sessions
- Navigating away from onboarding board ends the tour (by design)
