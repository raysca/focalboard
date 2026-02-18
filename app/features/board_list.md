Feature: Board List

  The Board List is a dedicated view at `/boards` for browsing, searching, filtering, and managing all boards.
  It is separate from the Dashboard (`/dashboard`), which shows user-specific info (stats, assigned cards, recent mentions).

  As a user, I want to see a dedicated list of boards so that I can select one to view and manage my workspace.

  Background:
    Given I am logged in
    And I have access to one or more boards

  Scenario: Access Board List from Sidebar
    Given I am viewing any page in the app
    Then I should see an "All Boards" link in the sidebar
    When I click the All Boards link in the sidebar
    Then I should navigate to the board list view at `/boards`
    And the sidebar should indicate the Boards view is active (e.g. highlighted state)

  Scenario: View Board List (Default Layout)
    Given I am on the board list page (navigated via sidebar)
    Then I should see a list of boards organized in sections
    And I should see "Starred" boards first (if any)
    And I should see "My Boards" or boards I created/own
    And I should see "Recently Viewed" boards (if any)
    And I should see "All Boards" or team/workspace boards
    And each board card should display:
      | Field           | Visible |
      | Board name      | Yes     |
      | Board icon      | Yes     |
      | Description     | Yes     |
      | Card count      | Yes     |
      | Last activity   | Yes     |
      | Favorite star   | Yes     |

  Scenario: View Board List in Grid Layout
    Given I am on the board list page
    When the board list is in grid view (default)
    Then I should see boards as cards in a responsive grid (1–3 columns based on viewport)
    And each board card should have a clickable area that navigates to the board
    And I should see a "Create New Board" card at the end of the list

  Scenario: View Board List in List Layout
    Given I am on the board list page
    When I switch to list view via the layout toggle
    Then I should see boards in a compact list/table format
    And each row should show board name, icon, description, card count, and last activity
    And I should be able to click a row to navigate to the board

  Scenario: Star a Board
    Given I am on the board list page
    And I see a board that is not starred
    When I click the star icon on the board card
    Then the board should appear in the "Starred" section
    And the star icon should appear filled/active

  Scenario: Unstar a Board
    Given I am on the board list page
    And I see a starred board
    When I click the star icon on the board card
    Then the board should be removed from the "Starred" section
    And the star icon should appear unfilled/inactive

  Scenario: Search Boards
    Given I am on the board list page
    When I enter text in the search input
    Then the board list should filter to show only boards matching the search
    And the search should match board name and description
    And the search should be case-insensitive
    And I should see "No boards found" when no boards match

  Scenario: Filter Boards by Ownership
    Given I am on the board list page
    When I click the "Filter" button
    Then I should see filter options:
      | Option           | Description                    |
      | All boards       | Show all boards I have access to |
      | My boards        | Show only boards I created      |
      | Starred          | Show only starred boards        |
      | Recently viewed  | Show boards I visited recently  |
    When I select "My boards"
    Then only boards I created should be displayed

  Scenario: Sort Boards
    Given I am on the board list page
    When I click the "Sort" button
    Then I should see sort options:
      | Option           | Description                    |
      | Last activity    | Most recently updated first    |
      | Name (A–Z)       | Alphabetical ascending         |
      | Name (Z–A)       | Alphabetical descending        |
      | Date created     | Newest first                   |
    When I select "Last activity"
    Then boards should be ordered by most recently modified first

  Scenario: Create New Board
    Given I am on the board list page
    When I click the "Create New Board" button or card
    Then a create board dialog should open
    And I should be able to enter a board title
    And I should be able to optionally add a description
    And I should be able to choose a template (if available)
    When I submit the form
    Then a new board should be created
    And I should be navigated to the new board (or it should appear in the list)

  Scenario: Empty State (No Boards)
    Given I am on the board list page
    And I have no boards
    Then I should see an empty state message
    And I should see a "Create Board" call-to-action button
    And I should not see the filter, sort, or search controls (or they should be disabled)

  Scenario: Empty State (No Search Results)
    Given I am on the board list page
    And I have boards
    When I search for text that matches no boards
    Then I should see "No boards found" or similar message
    And I should see an option to clear the search

  Scenario: Board Context Menu
    Given I am on the board list page
    When I click the menu icon (e.g. three dots) on a board card
    Then I should see a dropdown with options:
      | Option           | Description                    |
      | Open board       | Navigate to the board          |
      | Star / Unstar    | Toggle favorite                |
      | Copy board       | Duplicate the board            |
      | Board settings   | Edit name, description, etc.   |
      | Delete board     | Remove the board (with confirm) |

  Scenario: Copy Board
    Given I am on the board list page
    When I select "Copy board" from the board context menu
    Then a copy of the board should be created (with cards and structure)
    And the new board should have "(Copy)" appended to the name
    And the new board should appear in the list

  Scenario: Recently Viewed Boards
    Given I am on the board list page
    And I have previously visited one or more boards
    Then I should see a "Recently Viewed" section
    And recently viewed boards should be ordered by most recent visit first
    And the section should show at most 4–8 recent boards

  Scenario: Board Card Hover State
    Given I am on the board list page
    When I hover over a board card
    Then the card should have a visible hover state (e.g. border, shadow)
    And the board name may change color to indicate interactivity
    And the context menu icon may become visible (if hidden by default)

  Scenario: Responsive Behavior
    Given I am on the board list page
    When I view on a mobile viewport
    Then the grid should show 1 column
    When I view on a tablet viewport
    Then the grid should show 2 columns
    When I view on a desktop viewport
    Then the grid should show 3 columns

  Scenario: Keyboard Navigation
    Given I am on the board list page
    And the board list has focus
    When I press Tab
    Then focus should move through board cards and the create button
    When I press Enter on a focused board card
    Then I should navigate to that board
