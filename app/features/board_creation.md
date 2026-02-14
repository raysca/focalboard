# Board Creation

Feature: Create New Board

  As a user, I want to create and configure new boards so that I can organize projects with my team.

  Background:
    Given I am logged in to the application
    And I am on the dashboard

  @creation
  Scenario: Open Board Creation Modal
    When I click the "New Board" button
    Then a modal titled "Create Board" should appear
    And I should see fields for:
      | Field Name | Type | Required |
      | Board Name | Text | Yes |
      | Description | Text Area | No |
      | Visibility | Dropdown | Yes |
      | Template | Selection | No |

  @creation
  Scenario: Create Board with Valid Details
    Given I have opened the "Create Board" modal
    When I enter "Q4 Marketing Plan" as the board name
    And I select "Marketing" as the icon
    And I choose "Workspace Visible" for visibility
    And I click "Create"
    Then the board "Q4 Marketing Plan" should be created
    And I should be redirected to the new board view

  @validation
  Scenario: Validate Empty Board Name
    Given I have opened the "Create Board" modal
    When I leave the board name empty
    And I click "Create"
    Then I should see an error message "Board name is required"
    And the board should not be created

  @validation
  Scenario: Validate Duplicate Board Name
    Given a board named "Project Alpha" already exists
    And I have opened the "Create Board" modal
    When I enter "Project Alpha" as the board name
    And I click "Create"
    Then I should see an error message "A board with this name already exists"
    And the board should not be created

  @configuration
  Scenario: Configure Initial Lists
    Given I have opened the "Create Board" modal
    When I select the "Kanban" template
    Then I should see default lists: "To Do", "In Progress", "Done"
    When I add a new list named "Blocked"
    And I click "Create"
    Then the new board should be created with lists: "To Do", "In Progress", "Done", "Blocked"

  @team
  Scenario: Invite Team Members During Creation
    Given I have opened the "Create Board" modal
    When I search for user "jane.doe@example.com" in the "Invite Members" field
    And I select "Jane Doe" from the results
    And I assign "Editor" permission
    And I click "Create"
    Then the board should be created
    And "Jane Doe" should be a member of the board with "Editor" access
    And "Jane Doe" should receive a notification

  @visibility
  Scenario Outline: Set Board Visibility
    Given I have opened the "Create Board" modal
    When I select "<Visibility>" from the visibility dropdown
    And I click "Create"
    Then the board should have visibility set to "<Visibility>"

    Examples:
      | Visibility | Description |
      | Private | Only me and invited members |
      | Workspace | All workspace members can view |
      | Public | Anyone with the link can view |