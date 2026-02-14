# Playwright E2E Tests

This directory contains end-to-end tests for Focalboard using Playwright.

## Prerequisites

- Bun installed (latest version)
- Playwright browsers installed

## Installation

```bash
# Install dependencies
bun install

# Install Playwright browsers (first time only)
bunx playwright install chromium firefox webkit
```

## Running Tests

```bash
# Run all tests (headless mode)
bun test:e2e

# Run tests with UI mode (interactive)
bun test:e2e:ui

# Run tests in headed mode (see browser)
bun test:e2e:headed

# Run tests in debug mode
bun test:e2e:debug

# Run a specific test file
bunx playwright test tests/e2e/auth.spec.ts

# Run tests in a specific browser
bunx playwright test --project=chromium
bunx playwright test --project=firefox
bunx playwright test --project=webkit
```

## Test Structure

```
tests/e2e/
├── fixtures/
│   ├── auth.fixture.ts      # Authenticated context fixtures
│   └── pages/               # Page Object Models
│       ├── BasePage.ts
│       ├── LoginPage.ts
│       ├── RegisterPage.ts
│       ├── DashboardPage.ts
│       ├── BoardPage.ts
│       └── AdminPage.ts
├── auth.spec.ts             # Authentication tests
├── boards.spec.ts           # Board management tests
├── cards.spec.ts            # Card management tests
└── admin.spec.ts            # Admin settings tests
```

## Page Object Models

Page objects encapsulate page interactions for better maintainability:

- **BasePage**: Base class with common navigation methods
- **LoginPage**: Login form interactions
- **RegisterPage**: Registration form interactions
- **DashboardPage**: Board list and creation
- **BoardPage**: Card management and board operations
- **AdminPage**: Admin settings

## Test Fixtures

- **authenticatedPage**: Provides a browser context logged in as regular user (Bob)
- **adminPage**: Provides a browser context logged in as admin (Alice)

## Writing Tests

Example test using page objects:

```typescript
import { test, expect } from './fixtures/auth.fixture'
import { DashboardPage } from './fixtures/pages/DashboardPage'

test('should create new board', async ({ authenticatedPage }) => {
    const dashboard = new DashboardPage(authenticatedPage)
    await dashboard.goto()
    await dashboard.createBoard('My New Board')
    await expect(authenticatedPage).toHaveURL(/\/board\/.+/)
})
```

## Test Coverage

### Phase 1 (Implemented)
- ✅ User registration
- ✅ User login/logout
- ✅ Create board
- ✅ Delete board
- ✅ Create card
- ✅ Admin access control
- ✅ Admin settings display

### Future Enhancements
- Visual regression testing
- Accessibility testing (WCAG compliance)
- Performance testing (Core Web Vitals)
- Mobile responsive tests
- Drag and drop tests

## Debugging

```bash
# Run with Playwright Inspector
bun test:e2e:debug

# Generate trace for failed tests
bun test:e2e --trace on

# View test report
bunx playwright show-report
```

## CI/CD

Tests run automatically on:
- Push to main/master branch
- Pull requests

See `.github/workflows/playwright.yml` for CI configuration.

## Best Practices

1. **Use Page Objects**: Encapsulate page interactions
2. **Use data-testid**: Prefer `data-testid` over CSS selectors
3. **Auto-waiting**: Rely on Playwright's auto-waiting
4. **Test Isolation**: Each test should be independent
5. **Assertions**: Use Playwright's `expect` for better error messages
6. **Screenshots**: Captured automatically on failure
