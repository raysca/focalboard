Feature: Onboarding

  Onboarding is the process of getting a new user set up with the application.
  It introduces the user to the core concepts of Boards: Cards, Board Views, and Sidebar navigation.

  Background:
    Given a user "Bob" exists
    And "Bob" is a member of team "Focalboard"

  Scenario: First-time User Login (Welcome Page)
    Given "Bob" has not completed the onboarding
    When "Bob" logs in to the application
    Then "Bob" should be redirected to the Welcome Page
    And the Welcome Page should display:
      | Element           | Description                                      |
      | Heading           | "Welcome To Focalboard"                          |
      | Description       | Brief overview of the product value proposition  |
      | "Take a tour"     | Primary button to start the interactive tour     |
      | "No thanks"       | Link to skip the tour                            |

  Scenario: Starting the Onboarding Tour
    Given "Bob" is on the Welcome Page
    When "Bob" clicks "Take a tour"
    Then the system should create a personal "Welcome to Focalboard!" board for "Bob"
    And "Bob" should be redirected to the new "Welcome to Focalboard!" board
    And the "onboardingTourStarted" preference should be set to "1"
    And the "tourCategory" preference should be set to "onboarding"
    And the "onboardingTourStep" preference should be set to "0"

  Scenario: Tour Step 1 - Open a Card
    Given "Bob" has started the onboarding tour
    And the current tour category is "onboarding"
    And the current step is "0" (OPEN_A_CARD)
    Then "Bob" should see a visual cue pointing to a card on the board
    When "Bob" clicks on the card
    Then the card detail view should open
    And the tour should advance to the "card" category

  Scenario: Tour Step 2 - Card Details (Properties)
    Given the tour category is "card"
    And the current step is "0" (ADD_PROPERTIES)
    Then "Bob" should see a tip explaining card properties
    When "Bob" interacts with the properties menu
    Then the tour should advance find the next step

  Scenario: Tour Step 2.1 - Card Details (Comments)
    Given the tour category is "card"
    And the current step is "1" (ADD_COMMENTS)
    Then "Bob" should see a tip pointing to the comments section
    When "Bob" adds a comment
    Then the tour should advance to the next step

  Scenario: Tour Step 2.2 - Card Details (Description)
    Given the tour category is "card"
    And the current step is "2" (ADD_DESCRIPTION)
    Then "Bob" should see a tip pointing to the description field
    When "Bob" edits the description
    Then the tour should advance to the "board" category

  Scenario: Tour Step 3 - Board Features (Add View)
    Given the tour category is "board"
    And the current step is "0" (ADD_VIEW)
    Then "Bob" should see a tip pointing to the view switcher
    When "Bob" adds a new view
    Then the tour should advance to the next step

  Scenario: Tour Step 3.1 - Board Features (Copy Link)
    Given the tour category is "board"
    And the current step is "1" (COPY_LINK)
    Then "Bob" should see a tip explaining how to copy the board link
    When "Bob" copies the link
    Then the tour should advance to the next step

  Scenario: Tour Step 3.2 - Board Features (Share Board)
    Given the tour category is "board"
    And the current step is "2" (SHARE_BOARD)
    Then "Bob" should see a tip pointing to the Share button
    When "Bob" opens the Share dialog
    Then the tour should advance to the "sidebar" category

  Scenario: Tour Step 4 - Sidebar (Sidebar Navigation)
    Given the tour category is "sidebar"
    And the current step is "0" (SIDE_BAR)
    Then "Bob" should see a tip explaining the sidebar structure
    When "Bob" uses the sidebar
    Then the tour should advance to the next step

  Scenario: Tour Step 4.1 - Sidebar (Manage Categories)
    Given the tour category is "sidebar"
    And the current step is "1" (MANAGE_CATEGORIES)
    Then "Bob" should see a tip about managing sidebar categories
    When "Bob" interacts with categories
    Then the tour should advance to the next step

  Scenario: Tour Step 4.2 - Sidebar (Search for Boards)
    Given the tour category is "sidebar"
    And the current step is "2" (SEARCH_FOR_BOARDS)
    Then "Bob" should see a tip pointing to the "Find Boards" option
    When "Bob" uses the board search
    Then the tour is marked as complete
    And "Bob" has finished onboarding

  Scenario: Skipping the Tour
    Given "Bob" is on the Welcome Page
    When "Bob" clicks "No thanks, I'll figure it out myself"
    Then the "onboardingTourStep" preference should be set to "999" (FINISHED)
    And "Bob" should be redirected to the team dashboard or the previous URL
    And "Bob" should not see any tour tips

  Scenario: Existing User Skipping Welcome Page
    Given "Alice" is an existing user
    And "Alice" has viewed the Welcome Page before
    When "Alice" logs in
    Then "Alice" should be redirected directly to the last visited board or dashboard
    And "Alice" should not see the Welcome Page
