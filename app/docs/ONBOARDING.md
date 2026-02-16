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
