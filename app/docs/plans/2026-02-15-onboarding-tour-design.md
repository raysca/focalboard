# Onboarding Tour Implementation Design

**Date:** 2026-02-15
**Status:** Approved
**Author:** Claude Sonnet 4.5

## Overview

This design completes the onboarding tour feature by implementing the backend sample card creation and frontend tour display components. The welcome page was implemented in a previous commit, but the tour experience itself was incomplete.

## Background

The onboarding e2e tests were failing because:
1. Backend creates empty "Welcome to Focalboard!" board without sample cards
2. Frontend doesn't display tour popovers when on onboarding board
3. Cards lack `data-tour-target` attributes needed for tour progression

## Requirements

### Sample Cards
- 3 cards with rich content: "Getting Started", "Explore Views", "Share & Collaborate"
- Each card has description text
- Two properties: Status (Select: To Do/In Progress/Done) and Priority (Select: Low/Medium/High)
- Cards placed in single column/group

### Tour Behavior
- Floating overlay popover in fixed position (bottom-right corner)
- Shows current tour step with title, content, and actions
- "Next" and "Skip tour" buttons
- Advances automatically when user performs expected action (e.g., clicks card)
- Ends when user navigates away from onboarding board
- Four tour categories: onboarding → card → board → sidebar

## Approach: Backend-Heavy

**Rationale:** Sample cards are created once by the backend and persist as real data. This is simpler than frontend templates, easier to test, and allows users to modify/delete sample cards as they learn.

**Trade-offs:**
- ✅ Simple implementation
- ✅ Real data users can interact with
- ✅ Easy to test (seed database, verify cards exist)
- ❌ Board title becomes "magic string" for detection
- ❌ No easy way to reset onboarding board

## Architecture

### Backend (Data Layer)

**Endpoint:** `POST /teams/:teamID/onboard`

Creates complete onboarding board structure:
1. Board with title "Welcome to Focalboard!"
2. Default board view with single group "Getting Started"
3. Status property (Select type) with options: To Do, In Progress, Done
4. Priority property (Select type) with options: Low, Medium, High
5. Three sample cards:
   - **Card 0:** "Getting Started" (Status: To Do, Priority: High)
     - Description: Introduction to Focalboard basics
   - **Card 1:** "Explore Views" (Status: In Progress, Priority: Medium)
     - Description: Learn about different view types
   - **Card 2:** "Share & Collaborate" (Status: To Do, Priority: Low)
     - Description: Team collaboration features

### Frontend (Presentation Layer)

**Tour Detection:**
- Board page checks: `board.title === "Welcome to Focalboard!"`
- If true: `TourContext.setOnboardingBoard(true)`
- TourContext derives `isTourActive` from preferences + onboarding board state

**Tour Display:**
- `TourStepManager` component renders when `isTourActive === true`
- Reads current step from `TOUR_STEPS[tourCategory][tourStep]`
- Displays floating popover with step content
- Highlights target element using selector from step definition

**Tour Advancement:**
- Cards rendered with `data-tour-target="onboarding-card-{index}"` when on onboarding board
- Card click triggers `advanceTour()` which updates user preferences
- Preference updates cause TourStepManager to re-render with next step

### State Management

**Tour Preferences (stored in user preferences API):**
- `onboarding.tourStarted`: "1" when tour is active
- `onboarding.tourCategory`: Current category (onboarding/card/board/sidebar)
- `onboarding.tourStep`: Current step index (0-based) or 999 (TOUR_FINISHED)

**Tour Flow:**
```
onboarding (1 step) → card (3 steps) → board (3 steps) → sidebar (3 steps) → finished
```

## Components & Files

### Backend Changes

**File:** `app/src/backend/routes/onboarding.ts`

Extend existing endpoint to create:
- Board view (type: "board")
- Board group (title: "Getting Started")
- Property definitions for Status and Priority
- Property options for each property
- Three block records (type: "card") with titles, descriptions, property values

### Frontend Changes

**File:** `app/src/frontend/routes/_auth.board.$boardId.tsx`

Modifications:
1. Import `useTourContext`
2. Check if `board.title === "Welcome to Focalboard!"`
3. Call `setOnboardingBoard(true/false)` based on check
4. Render `<TourStepManager />` component

**File:** `app/src/frontend/components/onboarding/TourStepManager.tsx`

Verify existing component works as expected:
- Reads tour state from TourContext
- Renders TourPopover with current step
- Provides "Skip tour" button that calls `skipTour()`

**Card Rendering Logic:**

Wherever cards are rendered in board view:
- Add conditional `data-tour-target` attribute when on onboarding board
- Wire up card click to call `advanceTour()` when tourCategory === "onboarding"

### Existing Components (No Changes)

- `TourContext` - State management already implemented
- `TourPopover` - UI component already exists
- `TourBackdrop` - Element highlighting already exists
- `tourSteps.ts` - Step definitions already complete

## Data Flow

### Board Creation Flow

```
1. User clicks "Take a tour" on welcome page
2. Frontend POST /teams/{teamId}/onboard
3. Backend creates:
   - Board "Welcome to Focalboard!"
   - View with group "Getting Started"
   - Properties: Status, Priority
   - Cards: Getting Started, Explore Views, Share & Collaborate
4. Backend returns {teamID, boardID}
5. Frontend sets preferences:
   - tourStarted = "1"
   - tourCategory = "onboarding"
   - tourStep = "0"
6. Frontend navigates to /board/{boardID}
```

### Tour Display Flow

```
1. Board page loads
2. Check: board.title === "Welcome to Focalboard!"
3. TourContext.setOnboardingBoard(true)
4. TourContext derives: isTourActive = true
5. TourStepManager renders:
   - Reads TOUR_STEPS["onboarding"][0]
   - Displays floating popover (bottom-right)
   - Highlights [data-tour-target="onboarding-card-0"]
6. User clicks "Getting Started" card
7. advanceTour() updates preferences:
   - tourCategory = "card"
   - tourStep = "0"
8. TourStepManager re-renders with card category step
```

### Tour Skip Flow

```
1. User clicks "Skip tour" button
2. skipTour() updates preference: tourStep = "999"
3. TourContext: isTourActive = false
4. TourStepManager unmounts/hides
```

## Error Handling

### Backend Errors

**Board creation failure:**
- Scenario: Database constraint violation, transaction error
- Handling: Return 500 error, rollback transaction
- Frontend: Display error toast, keep user on welcome page

**Authentication failure:**
- Scenario: Session expired during board creation
- Handling: sessionRequired middleware returns 401
- Frontend: Redirect to login page

### Frontend Errors

**Preferences API failure:**
- Scenario: Network error updating tour preferences
- Handling: React Query automatic retry (3 attempts)
- Impact: Tour state may not persist across page refresh
- UX: User can continue using board, tour may not advance

**Board not found:**
- Scenario: Board deleted or access revoked
- Handling: 404 from board API
- UX: Display "Board not found" message, link to dashboard

**Tour context unavailable:**
- Scenario: TourProvider missing from component tree
- Handling: useTourContext throws clear error message
- Impact: Development-time only, caught during testing

### Graceful Degradation

- If tour fails to start, user still has functional board with sample cards
- Sample cards remain useful reference material
- Tour can be skipped at any time
- Navigating away ends tour cleanly (by design)

## Testing Strategy

### E2E Tests (Playwright)

Existing tests in `app/tests/e2e/onboarding.spec.ts` will validate:
- ✅ "Take a tour" creates board and navigates correctly
- ✅ Board title is "Welcome to Focalboard!"
- ✅ Sample cards visible: "Getting Started", "Explore Views", "Share & Collaborate"
- ✅ Cards have `data-tour-target` attributes
- ✅ Tour popover appears on board
- ✅ "Skip tour" button dismisses tour
- ✅ "No thanks" on welcome page goes to dashboard

**Success criteria:** All 8 onboarding e2e tests pass in chromium, firefox, and webkit.

### Backend Tests

Add tests for enhanced onboarding endpoint:

```typescript
describe('POST /teams/:teamID/onboard', () => {
  test('creates board with correct title')
  test('creates 3 sample cards')
  test('creates Status property with 3 options')
  test('creates Priority property with 3 options')
  test('assigns property values to cards')
  test('creates board view with group')
})
```

### Manual Testing Checklist

- [ ] Create new user account
- [ ] Click "Take a tour" on welcome page
- [ ] Verify 3 sample cards appear with titles and descriptions
- [ ] Verify cards show Status and Priority properties
- [ ] Verify tour popover appears in bottom-right corner
- [ ] Click "Getting Started" card, verify tour advances to card category
- [ ] Click "Skip tour", verify tour dismisses
- [ ] Navigate to dashboard, return to onboarding board
- [ ] Verify tour doesn't restart (tourStep = 999)
- [ ] Test in multiple browsers (Chrome, Firefox, Safari)

## Implementation Plan

Implementation will be handled by the writing-plans skill to create detailed step-by-step tasks.

High-level phases:
1. Backend: Extend onboarding route to create sample cards and properties
2. Frontend: Add tour detection and TourStepManager to board page
3. Frontend: Add data-tour-target attributes to cards
4. Frontend: Wire up tour advancement on card interactions
5. Testing: Verify all e2e tests pass

## Success Metrics

- All 8 onboarding e2e tests pass (0 failures, 24 total tests)
- No TypeScript compilation errors
- No console errors during tour flow
- Sample cards appear with expected content and properties
- Tour advances correctly through all 4 categories
- Tour can be skipped at any point

## Future Enhancements (Out of Scope)

- Reset onboarding board feature
- Multiple onboarding board templates
- Analytics tracking for tour completion rates
- Proper `boardType` field instead of title-based detection
- Tour localization for multiple languages
