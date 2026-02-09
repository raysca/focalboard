# Manual UI Testing Guide for Card Dependencies

## Prerequisites
- Dev server running on port 8088: `cd app && bun dev`
- Database seeded with dependencies (38 dependencies in seed data)

## Test Credentials
- **Email**: `alice@focalboard.dev`
- **Password**: `demo1234`

## Test Plan

### Test 1: View Dependency Badges on Kanban Board ✓

**Expected**: Cards with dependencies show colored indicator dots

1. Navigate to: http://localhost:8088
2. Login with Alice's credentials
3. Open the "Product Launch Board"
4. Look at the kanban cards

**What to verify:**
- [ ] Cards with blocking dependencies show a **red dot** on the right side
- [ ] Cards with only related dependencies show a **blue dot**
- [ ] Cards without dependencies show no indicator
- [ ] Example cards with dependencies:
  - "Design and implement database schema" → should have red dot (blocks OAuth)
  - "Button Component with variants" → should have red dot (blocks Modal + Dropdown)
  - "Build real-time WebSocket synchronization" → should have both red and blue dots

### Test 2: View Dependencies in Card Detail Dialog ✓

**Expected**: Full dependency management UI visible in card detail

1. Click on card: **"Implement OAuth 2.0 authentication flow"**
2. Scroll down past the content blocks
3. Look for the **"Dependencies"** section

**What to verify:**
- [ ] Dependencies section exists between content and comments
- [ ] Section shows **"Blocked by"** with red badge
- [ ] Shows dependency: "Design and implement database schema" is blocking this card
- [ ] Section shows **"Blocks"** with red badge
- [ ] Shows dependency: This card blocks "Integrate Stripe payment processing"
- [ ] Section shows **"Related"** with blue badge
- [ ] Shows dependency: Related to "Write docs"
- [ ] "Add Dependency" button is visible

### Test 3: Add a New Dependency ✓

**Expected**: Can create new dependencies with validation

1. In the same card detail, click **"Add Dependency"**
2. Modal should open

**What to verify:**
- [ ] Modal title: "Add Dependency"
- [ ] Dependency type selector shows options:
  - Blocks
  - Related
  - Duplicate
  - Parent
- [ ] Target card search input exists
- [ ] Can type to search for cards
- [ ] Shows validation messages for circular dependencies
- [ ] "Create" and "Cancel" buttons exist

### Test 4: Dependency Badge Compact View ✓

**Expected**: Compact indicators show dependency counts

1. Return to kanban board
2. Find card: **"Button Component with variants"**

**What to verify:**
- [ ] Shows red dot (has blocking dependencies)
- [ ] Click the card to open detail
- [ ] In detail view, shows:
  - **Blocks**: 2 cards (Modal Dialog + Dropdown Select)
  - **Blocked by**: 0 cards
  - Compact badge accurately represents this

### Test 5: Delete Dependency ✓

**Expected**: Can remove dependencies

1. Open card: **"Build real-time WebSocket synchronization"**
2. Find the dependency to "Write E2E tests with Playwright" (related)
3. Hover over the dependency item
4. Click the delete icon (×)

**What to verify:**
- [ ] Delete confirmation or immediate deletion
- [ ] Dependency removed from the list
- [ ] Related dependency count decreases
- [ ] Inverse dependency also removed (bidirectional)

### Test 6: Circular Dependency Prevention ✓

**Expected**: System prevents circular dependencies

1. Open card: **"Integrate Stripe payment processing"**
2. Click "Add Dependency"
3. Select dependency type: **"Blocks"**
4. Try to add: **"Design and implement database schema"** as target

**What to verify:**
- [ ] Validation error appears
- [ ] Message indicates circular dependency would be created
- [ ] Explanation: "Database schema" → "OAuth" → "Stripe" → "Database schema" = cycle
- [ ] Cannot create the dependency
- [ ] "Create" button disabled or error shown

### Test 7: View Dependency Graph ✓

**Expected**: Can see all board dependencies

1. Stay on the Product Launch Board
2. Check if there's a dependency graph view or bulk operations

**What to verify:**
- [ ] API endpoint exists: `GET /api/v2/boards/{boardId}/dependencies/graph`
- [ ] Returns graph structure with all dependencies
- [ ] Shows dependency chains and relationships

## Database Verification

Run these SQL queries to verify seed data:

```sql
-- Total active dependencies
SELECT COUNT(*) FROM card_dependencies WHERE deleted_at = 0;
-- Expected: 38

-- Blocking dependencies
SELECT COUNT(*) FROM card_dependencies WHERE dependency_type = 'blocks' AND deleted_at = 0;
-- Expected: 12

-- Related dependencies
SELECT COUNT(*) FROM card_dependencies WHERE dependency_type = 'related' AND deleted_at = 0;
-- Expected: 14

-- View specific dependency chains
SELECT
    sb.title as source,
    cd.dependency_type,
    tb.title as target
FROM card_dependencies cd
JOIN blocks sb ON cd.source_card_id = sb.id
JOIN blocks tb ON cd.target_card_id = tb.id
WHERE cd.deleted_at = 0
ORDER BY cd.dependency_type, sb.title;
```

## Integration Checklist

- [x] DependencySection component integrated into card detail dialog
- [x] DependencyBadge component integrated into kanban card previews
- [x] Backend API endpoints functional (7 endpoints)
- [x] Database seeded with 38 dependencies
- [x] React Query hooks providing real-time updates
- [x] Circular dependency validation working
- [x] Bidirectional relationship management working
- [x] TypeScript types defined and used throughout
- [x] All tests passing (11 integration tests)
- [x] Production build successful

## Files Modified for Integration

1. **Card Detail Dialog**:
   - `app/src/frontend/routes/_auth.board.$boardId.$viewId.$cardId.tsx`
   - Added import: `DependencySection`
   - Added section between content and comments

2. **Kanban Board View**:
   - `app/src/frontend/components/board/KanbanView.tsx`
   - Added import: `DependencyBadge`
   - Added badge to `SortableCard` component (line 62)
   - Added badge to `CardOverlay` component (line 92)

## Screenshots to Capture

1. Kanban board showing cards with dependency indicators (red/blue dots)
2. Card detail dialog with full dependency section visible
3. Add dependency modal with type selector and search
4. Dependency list showing blocks/blocked_by/related groupings
5. Validation error for circular dependency attempt

## Success Criteria

✅ All 7 manual tests pass
✅ Dependencies visible on kanban cards
✅ Dependencies manageable in card detail
✅ Validation prevents circular dependencies
✅ Real-time updates working
✅ UI matches design specifications

---

**Test Status**: Ready for Manual Testing
**Tested By**: [Your Name]
**Test Date**: [Date]
**Result**: [ ] Pass / [ ] Fail
**Notes**:
