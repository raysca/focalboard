Context
The Go backend has been fully replaced with a Bun/Hono/Drizzle ORM stack at app/src/backend/ (79 API endpoints, 96 passing tests). The frontend is the next migration target: move the legacy React 17 webapp (webapp/src/) to app/src/frontend/ using React 19, TanStack Router, TanStack Query, Tailwind CSS v4, and Bun's native build system. The overall UX of Focalboard must be preserved — same layout, colors, interactions — but restyled with Tailwind and powered by modern React patterns. Each phase must be verified in-browser before proceeding.
What exists today:

Legacy webapp: webapp/src/ — React 17, Redux Toolkit, React Router v5, SCSS, 50+ components, octoClient.ts API layer
New app scaffold: app/src/ — React 19 + Tailwind v4 installed but unused (only demo App.tsx)
New backend: app/src/backend/ — 79 Hono endpoints under /api/v2, all tested
All deps installed: @tanstack/react-router, @tanstack/react-query, tailwindcss, lucide-react, clsx, tailwind-merge

Key legacy files to reference:

Layout: webapp/src/components/workspace.tsx, webapp/src/components/centerPanel.tsx
Sidebar: webapp/src/components/sidebar/sidebar.tsx
Views: webapp/src/components/kanban/kanban.tsx, webapp/src/components/table/table.tsx, webapp/src/components/gallery/gallery.tsx, webapp/src/components/calendar/fullCalendar.tsx
Cards: webapp/src/components/cardDialog.tsx, webapp/src/components/cardDetail/cardDetail.tsx
Auth: webapp/src/pages/loginPage.tsx, webapp/src/pages/registerPage.tsx
API: webapp/src/octoClient.ts, webapp/src/mutator.ts
Styles: webapp/src/styles/shared-variables.scss, webapp/src/styles/focalboard-variables.scss
Widgets: webapp/src/widgets/ (buttons, menus, editable, etc.)
State: webapp/src/store/ (Redux slices for boards, cards, views, users, sidebar, etc.)


Pre-Migration Fixes
Files to modify:

app/src/index.ts — Fix SPA fallback path from ./src/webapp/index.html → ./src/index.html
app/src/index.html — Update <title> to "Focalboard", update CSS import path
app/src/frontend.tsx — Update to import from ./frontend/App
app/package.json — Add DnD dependency: @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities


Target Directory Structure
app/src/frontend/
  index.css                  # Tailwind @theme design tokens
  App.tsx                    # Root: QueryClient + AuthProvider + UIProvider + RouterProvider
  router.tsx                 # TanStack Router config (all routes, auth guards)
  api/
    client.ts                # Typed fetch wrapper (token, CSRF, error handling)
    types.ts                 # Board, Block, Card, View, User, Category, etc.
    auth.ts                  # login, logout, register, changePassword, getMe
    boards.ts                # board CRUD
    blocks.ts                # block CRUD
    cards.ts                 # card operations
    members.ts               # board member operations
    categories.ts            # sidebar category operations
    teams.ts                 # team operations
    users.ts                 # user operations
    sharing.ts               # sharing operations
    search.ts                # board search
    files.ts                 # file upload/serve
  hooks/
    useAuth.ts               # Auth query + mutation hooks
    useBoards.ts             # Board query + mutation hooks
    useBlocks.ts             # Block/view/card data hooks
    useCards.ts              # Card query hooks
    useMembers.ts            # Member query hooks
    useCategories.ts         # Category query hooks
    useTeams.ts              # Team query hooks
    useUsers.ts              # User query hooks
  contexts/
    AuthContext.tsx           # Auth state (user, token, isLoggedIn)
    UIContext.tsx             # UI state (sidebar collapsed, theme, active card)
  routes/
    __root.tsx               # Root layout
    _auth.tsx                # Authenticated layout (sidebar + center)
    _auth.board.$boardId.tsx
    _auth.board.$boardId.$viewId.tsx
    _auth.board.$boardId.$viewId.$cardId.tsx
    login.tsx
    register.tsx
    change-password.tsx
    shared.$boardId.tsx
    index.tsx                # Root redirect
  components/
    ui/                      # Button, Input, Dialog, Editable, Skeleton, Toast, ErrorBoundary
    sidebar/                 # Sidebar, SidebarCategory, SidebarBoardItem, SidebarUserMenu
    board/                   # KanbanView, TableView, GalleryView, CalendarView, ViewTitle, PropertyValue
    card/                    # CardDialog, CardDetail, CardDetailProperties, CardDetailContents
    viewHeader/              # ViewHeader, FilterComponent, SortMenu, GroupByMenu, NewCardButton
  lib/
    cn.ts                    # clsx + tailwind-merge helper
    cardFilter.ts            # Card filtering logic
    boardUtils.ts            # Card grouping/sorting logic
    theme.ts                 # Theme management (default, dark, light)

Phase 1: Foundation
Goal: Project structure, Tailwind design system, TanStack Router skeleton, typed API client, auth context. App renders routes with Tailwind styling.
Files to create:
FilePurposeapp/src/frontend/index.cssTailwind @theme with Focalboard design tokens (colors, shadows, radii, fonts matching legacy SCSS vars)app/src/frontend/App.tsxRoot: QueryClientProvider → AuthProvider → UIProvider → RouterProviderapp/src/frontend/router.tsxTanStack Router: rootRoute, loginRoute, registerRoute, authRoute (guarded), boardRoute, sharedRoute, indexRoute redirectapp/src/frontend/lib/cn.tscn() helper: twMerge(clsx(...inputs))app/src/frontend/lib/constants.tsApp constants (default team ID, localStorage keys)app/src/frontend/api/client.tsFetch wrapper: api.get/post/patch/put/delete, auto Authorization: Bearer, X-Requested-With: XMLHttpRequest, error normalizationapp/src/frontend/api/types.tsTypeScript interfaces: Board, Block, Card, BoardView, User, BoardMember, Category, Team, Sharing, IPropertyTemplate, IPropertyOption, FilterGroup, FilterClauseapp/src/frontend/contexts/AuthContext.tsxAuth state with login(), logout(), register(), isLoggedIn, userapp/src/frontend/contexts/UIContext.tsxUI state: sidebarCollapsed, theme, activeCardIdapp/src/frontend/routes/__root.tsxRoot layout: renders <Outlet />app/src/frontend/routes/index.tsxRedirect to /login or last board
Files to modify:
FileChangeapp/src/frontend.tsxImport App from ./frontend/Appapp/src/index.htmlTitle → "Focalboard", CSS import → ./frontend/index.cssapp/src/index.tsSPA fallback → ./src/index.html
Key design tokens (index.css):
css@import "tailwindcss";

@theme {
  --color-center-bg: #ffffff;
  --color-center-fg: #3f4350;
  --color-sidebar-bg: #1e3254;
  --color-sidebar-fg: #ffffff;
  --color-button-bg: #1c58d9;
  --color-button-fg: #ffffff;
  --color-button-danger: #d24b4e;
  --color-link: #386fe5;
  --color-error: #d24b4e;
  --color-prop-default: #ffffff;
  --color-prop-gray: #ededed;
  --color-prop-brown: #f7ddc3;
  --color-prop-orange: #ffd3c1;
  --color-prop-yellow: #f7f0b6;
  --color-prop-green: #c7eac3;
  --color-prop-blue: #b1d1f6;
  --color-prop-purple: #e6d0ff;
  --color-prop-pink: #ffd6e9;
  --color-prop-red: #ffa9a9;
  --shadow-elevation-1: 0 2px 3px 0 rgba(0,0,0,0.08);
  --shadow-elevation-2: 0 4px 6px 0 rgba(0,0,0,0.12);
  --shadow-elevation-3: 0 6px 14px 0 rgba(0,0,0,0.12);
  --shadow-elevation-4: 0 8px 24px 0 rgba(0,0,0,0.12);
  --radius-default: 4px;
  --radius-modal: 8px;
  --sidebar-width: 240px;
  --kanban-column-width: 260px;
  --font-sans: 'Open Sans', sans-serif;
}
API client pattern (api/client.ts):
typescriptconst TOKEN_KEY = 'focalboardSessionId'

function headers(): HeadersInit {
    const token = localStorage.getItem(TOKEN_KEY)
    return {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
    const res = await fetch(`/api/v2${path}`, { ...opts, headers: { ...headers(), ...opts.headers as Record<string,string> } })
    if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => ({})))
    return res.json()
}

export const api = { get, post, patch, put, del, setToken, clearToken, getToken }
```

### Router pattern (`router.tsx`):

All routes use TanStack Router code-based definitions. Auth guard via `beforeLoad` on the `_auth` layout route. Routes:
- `/login`, `/register`, `/change-password` — public
- `/board/$boardId`, `/board/$boardId/$viewId`, `/board/$boardId/$viewId/$cardId` — auth required
- `/shared/$boardId` — public (read-only)
- `/` — redirect based on auth state

### Browser verification:
- [ ] App loads at `http://localhost:8088` with Tailwind styles applied
- [ ] `/login` renders (can be placeholder text)
- [ ] `/` redirects to `/login` when not authenticated
- [ ] No React errors in console
- [ ] TanStack Router devtools visible in dev mode

---

## Phase 2: Auth Pages

**Goal:** Login, Register, Change Password pages matching legacy design. Auth context manages tokens and user state.

### Files to create:

| File | Purpose |
|------|---------|
| `app/src/frontend/api/auth.ts` | `login()`, `logout()`, `register()`, `changePassword()`, `getMe()` |
| `app/src/frontend/hooks/useAuth.ts` | `useMeQuery()`, `useLoginMutation()`, `useLogoutMutation()`, `useRegisterMutation()` |
| `app/src/frontend/routes/login.tsx` | Login page: centered card, email/password inputs, submit button, link to register |
| `app/src/frontend/routes/register.tsx` | Register page: centered card, email/username/password inputs |
| `app/src/frontend/routes/change-password.tsx` | Change password: old + new password inputs |
| `app/src/frontend/components/ui/Button.tsx` | `Button` component: `filled`, `danger`, `size` props |
| `app/src/frontend/components/ui/Input.tsx` | `Input` component: styled text input |

### Key Tailwind for login card (replicating `loginPage.scss`):
```
// Card container
"w-[450px] mx-auto mt-[150px] flex flex-col items-center py-12
 border border-black/10 rounded-[15px]
 shadow-[rgba(63,67,80,0.1)_0_0_0_1px,rgba(63,67,80,0.3)_0_4px_8px]
 bg-center-bg"

// Input
"w-[250px] border border-black/20 rounded-default p-2 min-h-[44px] bg-center-bg text-center-fg"

// Submit button
"mt-3 mb-5 min-h-[38px] min-w-[250px] bg-button-bg text-button-fg rounded-default font-semibold cursor-pointer hover:opacity-90"
```

### Browser verification:
- [ ] `/login` shows centered card with email/password fields and "Log in" button
- [ ] Entering valid credentials redirects to `/board/` (or default board)
- [ ] Invalid credentials show "Login failed" error text in red
- [ ] `/register` shows card with email/username/password and "Register" button
- [ ] Successful registration auto-logs in and redirects
- [ ] `/change-password` shows old/new password fields
- [ ] Token persists in `localStorage` — page refresh maintains login
- [ ] Logging out clears token, redirects to `/login`

---

## Phase 3: App Shell

**Goal:** Authenticated layout with sidebar (board list, categories, user menu) and center panel. Route guards redirect unauthenticated users.

### Files to create:

| File | Purpose |
|------|---------|
| `app/src/frontend/api/boards.ts` | `getBoards(teamId)`, `getBoard(boardId)`, `createBoard()`, `patchBoard()`, `deleteBoard()`, `duplicateBoard()` |
| `app/src/frontend/api/categories.ts` | `getCategories(teamId)`, `createCategory()`, `updateCategory()`, `deleteCategory()`, `reorderCategories()` |
| `app/src/frontend/api/teams.ts` | `getTeams()`, `getTeam(teamId)` |
| `app/src/frontend/hooks/useBoards.ts` | `useBoardsQuery(teamId)`, `useBoardQuery(boardId)`, `useCreateBoardMutation()`, etc. |
| `app/src/frontend/hooks/useCategories.ts` | `useCategoriesQuery(teamId)`, `useCreateCategoryMutation()`, etc. |
| `app/src/frontend/hooks/useTeams.ts` | `useTeamsQuery()` |
| `app/src/frontend/routes/_auth.tsx` | Auth layout: `<div className="flex h-full"><Sidebar /><Outlet /></div>` |
| `app/src/frontend/components/sidebar/Sidebar.tsx` | Sidebar: board categories, board items, user menu, add board button |
| `app/src/frontend/components/sidebar/SidebarCategory.tsx` | Collapsible category group with board list |
| `app/src/frontend/components/sidebar/SidebarBoardItem.tsx` | Board entry: icon + title + options menu, active state highlighting |
| `app/src/frontend/components/sidebar/SidebarUserMenu.tsx` | User avatar, logout, theme toggle |

### Key Tailwind for sidebar (replicating `sidebar.scss`):
```
// Sidebar container
"shrink-0 w-[var(--sidebar-width)] flex flex-col h-full bg-sidebar-bg text-sidebar-fg py-6"

// Board item
"flex items-center h-8 px-5 cursor-pointer rounded-r-[20px] mr-2
 text-sidebar-fg/80 hover:bg-white/10
 data-[active=true]:bg-white/20 data-[active=true]:text-sidebar-fg"

// Add board button
"flex items-center h-9 px-5 cursor-pointer text-sidebar-fg/60 hover:bg-white/10"

// Sidebar header
"flex items-center h-12 px-4 font-semibold"
```

### Browser verification:
- [ ] After login, sidebar appears on left (240px, dark navy #1e3254)
- [ ] Board list populates from API
- [ ] Categories are collapsible
- [ ] Clicking a board navigates to `/board/:boardId` (center area updates)
- [ ] Active board is highlighted in sidebar
- [ ] User menu shows at top with logout option
- [ ] Center panel shows "Select a board" when no board is active
- [ ] Unauthenticated `/board/*` access redirects to `/login`

---

## Phase 4: Board Views

**Goal:** Implement all 4 view types. Kanban first (most important), then Table, Gallery, Calendar.

### Files to create:

| File | Purpose |
|------|---------|
| `app/src/frontend/api/blocks.ts` | `getBlocks(boardId)`, `insertBlocks()`, `patchBlock()`, `deleteBlock()` |
| `app/src/frontend/hooks/useBlocks.ts` | `useBoardDataQuery(boardId)` — fetches blocks, splits into views/cards/contents via `select` |
| `app/src/frontend/routes/_auth.board.$boardId.tsx` | Board page: fetches board + blocks, renders ViewHeader + active view |
| `app/src/frontend/routes/_auth.board.$boardId.$viewId.tsx` | Board page with specific view selected |
| `app/src/frontend/components/board/ViewTitle.tsx` | Board icon + editable title + description toggle |
| `app/src/frontend/components/viewHeader/ViewHeader.tsx` | View tabs, filter/sort/group controls, new card button |
| `app/src/frontend/components/viewHeader/NewCardButton.tsx` | "+ New" button |
| `app/src/frontend/components/viewHeader/ViewHeaderSortMenu.tsx` | Sort options dropdown |
| `app/src/frontend/components/viewHeader/ViewHeaderGroupByMenu.tsx` | Group by property dropdown |
| `app/src/frontend/components/viewHeader/ViewHeaderPropertiesMenu.tsx` | Visible properties toggle |
| `app/src/frontend/components/viewHeader/FilterComponent.tsx` | Filter builder |
| `app/src/frontend/components/board/KanbanView.tsx` | Kanban board with columns |
| `app/src/frontend/components/board/KanbanColumn.tsx` | Column container |
| `app/src/frontend/components/board/KanbanColumnHeader.tsx` | Column header (group name, count, + button) |
| `app/src/frontend/components/board/KanbanCard.tsx` | Card in kanban column |
| `app/src/frontend/components/board/TableView.tsx` | Table/spreadsheet view |
| `app/src/frontend/components/board/TableRow.tsx` | Table row |
| `app/src/frontend/components/board/TableHeaders.tsx` | Table column headers (resizable) |
| `app/src/frontend/components/board/GalleryView.tsx` | Card gallery grid |
| `app/src/frontend/components/board/GalleryCard.tsx` | Gallery card tile |
| `app/src/frontend/components/board/CalendarView.tsx` | Month calendar grid |
| `app/src/frontend/components/board/PropertyValue.tsx` | Renders property values with correct colors |
| `app/src/frontend/lib/cardFilter.ts` | Card filtering logic (port from `webapp/src/cardFilter.ts`) |
| `app/src/frontend/lib/boardUtils.ts` | Card grouping/sorting (port from `webapp/src/boardUtils.ts`) |

### Key Tailwind for kanban (replicating `kanban.scss`):
```
// Board container
"overflow-auto flex-1"

// Column header row (sticky)
"flex w-max min-h-[30px] py-4 text-center-fg/50 sticky top-0 bg-center-bg z-10"

// Column
"shrink-0 flex flex-col w-[var(--kanban-column-width)] mr-[15px]"

// Kanban card
"rounded-default mb-4 p-3 px-4 cursor-pointer text-center-fg
 shadow-[rgba(63,67,80,0.1)_0_0_0_1px,rgba(63,67,80,0.1)_0_2px_4px]
 hover:bg-center-fg/[0.08] transition-colors"

// Property label badge
"text-xs px-2 py-0.5 rounded-sm" + propColorMap[color]
Property color map:
typescriptconst propColorMap: Record<string, string> = {
    default: 'bg-prop-default', gray: 'bg-prop-gray', brown: 'bg-prop-brown',
    orange: 'bg-prop-orange', yellow: 'bg-prop-yellow', green: 'bg-prop-green',
    blue: 'bg-prop-blue', purple: 'bg-prop-purple', pink: 'bg-prop-pink', red: 'bg-prop-red',
}
```

### Browser verification:
- [ ] Clicking a board shows kanban view with columns grouped by first select property
- [ ] Cards render in correct columns with title, icon, property badges
- [ ] View tabs in header switch between Board/Table/Gallery/Calendar
- [ ] Table view shows rows with columns matching board properties
- [ ] Gallery shows card grid with responsive columns
- [ ] Calendar shows month grid with cards on dates
- [ ] Sort/filter/group controls update the view
- [ ] "+ New" button creates a card (appears immediately via optimistic update)
- [ ] Property label colors match legacy (gray, blue, green, etc.)

---

## Phase 5: Card System

**Goal:** Card dialog/detail view with properties editing, content blocks, and comments.

### Files to create:

| File | Purpose |
|------|---------|
| `app/src/frontend/routes/_auth.board.$boardId.$viewId.$cardId.tsx` | Route that renders board view + card dialog overlay |
| `app/src/frontend/components/ui/Dialog.tsx` | Modal overlay with backdrop, Escape to close |
| `app/src/frontend/components/card/CardDialog.tsx` | Card modal wrapper — fetches card data, renders CardDetail |
| `app/src/frontend/components/card/CardDetail.tsx` | Card detail: icon, title, properties panel, content, comments |
| `app/src/frontend/components/card/CardDetailProperties.tsx` | Property list with inline editing per type |
| `app/src/frontend/components/card/CardDetailContents.tsx` | Content blocks (text, image, checkbox, divider, headings) |
| `app/src/frontend/components/card/CommentsList.tsx` | Comment thread with add comment input |
| `app/src/frontend/components/card/properties/SelectPropertyEditor.tsx` | Color-coded select dropdown |
| `app/src/frontend/components/card/properties/TextPropertyEditor.tsx` | Inline text input |
| `app/src/frontend/components/card/properties/DatePropertyEditor.tsx` | Date picker |
| `app/src/frontend/components/card/properties/CheckboxPropertyEditor.tsx` | Toggle checkbox |
| `app/src/frontend/components/card/properties/PersonPropertyEditor.tsx` | User selector |

### Key Tailwind for dialog:
```
// Backdrop
"fixed inset-0 bg-black/50 z-40 flex items-start justify-center pt-[10vh]"

// Dialog content
"bg-center-bg rounded-modal shadow-elevation-4 w-full max-w-3xl max-h-[80vh] overflow-y-auto"
```

### Browser verification:
- [ ] Clicking a card in any view opens the card dialog as modal overlay
- [ ] URL updates to include `/$cardId`
- [ ] Card shows icon, editable title, properties panel, content area, comments
- [ ] Properties are editable — click to edit, blur/Enter to save
- [ ] Select properties show color-coded options dropdown
- [ ] Closing dialog (Escape or backdrop click) returns to board view, URL updates
- [ ] Adding a comment appears immediately
- [ ] Card title is editable inline

---

## Phase 6: Board Features

**Goal:** Board CRUD, sharing, templates, categories management, search, member management.

### Files to create:

| File | Purpose |
|------|---------|
| `app/src/frontend/api/sharing.ts` | `getSharing()`, `setSharing()` |
| `app/src/frontend/api/members.ts` | `getMembers()`, `addMember()`, `updateMember()`, `removeMember()` |
| `app/src/frontend/api/search.ts` | `searchBoards()` |
| `app/src/frontend/hooks/useMembers.ts` | Member query + mutation hooks |
| `app/src/frontend/components/board/BoardTemplateSelector.tsx` | Template picker when no board selected |
| `app/src/frontend/components/board/ShareBoardDialog.tsx` | Toggle sharing, copy link, regenerate token |
| `app/src/frontend/components/board/MembersDialog.tsx` | List members, add/remove, change roles |
| `app/src/frontend/components/sidebar/BoardSearch.tsx` | Board search input in sidebar |

### Browser verification:
- [ ] "Create board" shows template selector with options
- [ ] New board appears in sidebar immediately
- [ ] Board title/description/icon editable from board header
- [ ] Share dialog: toggle sharing on, copy link, open link in incognito — board visible
- [ ] Members dialog: list members, add by email/name, remove, change role
- [ ] Sidebar categories: create, rename, delete, reorder
- [ ] Board search works from sidebar

---

## Phase 7: Interactions

**Goal:** Drag-and-drop (kanban cards, sidebar boards), inline editing, keyboard shortcuts.

### Dependencies to install:
```
bun add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### Files to create/modify:

| File | Purpose |
|------|---------|
| `app/src/frontend/components/board/KanbanView.tsx` | Enhance with `DndContext` + `SortableContext` for card DnD between columns |
| `app/src/frontend/components/sidebar/Sidebar.tsx` | Enhance with DnD for board reordering within/between categories |
| `app/src/frontend/components/ui/Editable.tsx` | Inline text editing: click to activate, Enter to save, Escape to cancel |
| `app/src/frontend/lib/keyboard.ts` | Keyboard shortcut handler |

### Browser verification:
- [ ] Cards can be dragged between kanban columns — drop triggers API update
- [ ] Card order within a column persists after drag
- [ ] Boards can be reordered in sidebar via drag
- [ ] Inline text editing works for board title, card title, property values
- [ ] Escape closes card dialog
- [ ] Keyboard nav works

---

## Phase 8: Polish

**Goal:** Error boundaries, loading skeletons, responsive design, theme toggle, toast notifications.

### Files to create:

| File | Purpose |
|------|---------|
| `app/src/frontend/components/ui/ErrorBoundary.tsx` | Error boundary with retry button |
| `app/src/frontend/components/ui/Skeleton.tsx` | Pulse animation skeleton components |
| `app/src/frontend/components/ui/Toast.tsx` | Toast notification system via context + portal |
| `app/src/frontend/lib/theme.ts` | Theme definitions (default, dark, light) matching legacy `webapp/src/theme.ts` |

### Theme colors (from legacy):
```
default: sidebar #1e3254, center #ffffff, text #3f4350
dark:    sidebar #4b4943, center #373535, text #dcdcdc
light:   sidebar #f7f6f3, center #ffffff, text #373535
Browser verification:

 Loading states show skeleton placeholders (pulsing)
 Errors show boundary with retry button, no white screen
 Toast notifications appear for actions (board created, card moved, error)
 Theme toggle in sidebar settings switches between default/dark/light
 Dark theme applies correctly across all components
 Mobile: sidebar auto-collapses below 768px
 Kanban scrolls horizontally on narrow screens
 Card dialog goes full-width on mobile


Verification After All Phases

bun dev — server starts, frontend loads at http://localhost:8088
Register → Login → see sidebar + boards
Create a board from template → kanban view renders
Create cards → drag between columns → card order persists
Open card dialog → edit properties, add comments → changes saved
Switch views: Board → Table → Gallery → Calendar
Share board → open shared link in incognito → read-only view works
Toggle dark theme → all components restyle correctly
Logout → redirected to login → token cleared
All existing backend tests still pass: bun test (96 tests)