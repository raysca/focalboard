# 🧪 Manual Testing Guide for Onboarding Tour

## Quick Start

The dev server is **already running** on http://localhost:8088

## Test the Onboarding Tour

### Option 1: Test with Existing User (Quickest)

1. **Open browser** to: http://localhost:8088
2. **Login** with credentials:
   - Email: `bob@focalboard.dev`
   - Password: `demo1234`

3. **Navigate to welcome page manually:**
   - Go to: http://localhost:8088/welcome

4. **Verify Welcome Page:**
   - ✅ See "Welcome to Focalboard! 🎉" heading
   - ✅ See "Take a tour" button
   - ✅ See "No thanks, I'll figure it out myself" button

5. **Click "Take a tour":**
   - ✅ Redirects to new board
   - ✅ Board title: "Welcome to Focalboard!"
   - ✅ Shows 3 sample cards:
     - 🎯 Getting Started
     - 👁️ Explore Views
     - 🤝 Share & Collaborate
   - ✅ Cards organized in 3 columns (To Do, In Progress, Done)

6. **Inspect First Card:**
   - Right-click on "Getting Started" card
   - Select "Inspect Element"
   - ✅ Verify it has attribute: `data-tour-target="onboarding-card-0"`

### Option 2: Test Skip Tour Flow

1. Go to: http://localhost:8088/welcome
2. Click **"No thanks, I'll figure it out myself"**
3. ✅ Should redirect to dashboard

### Option 3: Test First-Time User Flow (Requires DB Reset)

To test the complete first-time user experience:

```bash
# 1. Stop the dev server
pkill -f "bun.*dev"

# 2. Reset database (clears all preferences)
bun src/backend/db/seed.ts --force

# 3. Restart dev server
bun dev
```

Then:
1. Open browser to http://localhost:8088
2. Login as bob@focalboard.dev / demo1234
3. ✅ Should **automatically** redirect to /welcome
4. Click "Take a tour"
5. ✅ Creates onboarding board

## What to Look For

### ✅ Success Indicators
- Welcome page loads without errors
- "Take a tour" creates new board
- Board contains exactly 3 cards
- Cards have icons and descriptions
- Cards are in correct status columns
- No JavaScript console errors

### ❌ Potential Issues
If you see errors, check:
- Browser console for JavaScript errors (F12)
- Network tab shows successful API calls
- Server terminal for backend errors

## Testing Tour Behavior (Future)

Once action detection is implemented:
1. Click on "Getting Started" card → tour should show next step
2. Edit card properties → tour advances
3. Add comment → tour advances
4. Edit description → tour transitions to board category
5. Continue through all 10 steps → tour completes

## Current Status

**What's Implemented:**
- ✅ Welcome page with tour options
- ✅ Onboarding board creation (3 sample cards)
- ✅ Tour state management (TourContext)
- ✅ Tour UI components (TourPopover, TourBackdrop)
- ✅ Tour step definitions (10 steps across 4 categories)
- ✅ Card tour targets (data attributes)
- ✅ Preference persistence

**What's Pending:**
- ⏳ Tour popover display (TourStepManager watches for targets)
- ⏳ Action detection (advancing tour based on user actions)
- ⏳ Additional tour targets (card detail, views, sidebar)

## Quick Verification Checklist

- [ ] Server running on port 8088
- [ ] Can login successfully
- [ ] Welcome page accessible at /welcome
- [ ] "Take a tour" creates board
- [ ] Board has title "Welcome to Focalboard!"
- [ ] 3 sample cards visible
- [ ] Cards have correct icons (🎯 👁️ 🤝)
- [ ] First card has data-tour-target="onboarding-card-0"
- [ ] No console errors

---

**Ready to test!** The server is running and waiting for you to test the tour. 🚀
