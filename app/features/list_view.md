Feature: Table View

  As a user, I want to view my boards in a table format so that I can easily see all my cards and their properties in rows and columns.

  Background:
    Given I am on the "Company Goals & OKRs" board
    And the board has the following properties:
      | Name       | Type     | Options |
      | Name       | Text     |         |
      | Objective  | Select   | Grow Revenue, Delight Customers, Drive Product Adoption |
      | Status     | Status   | AT RISK, IN PROGRESS, NOT STARTED, COMPLETE |
      | Department | Select   | SALES, MARKETING, SUPPORT, PRODUCT, ENGINEERING |
      | Priority   | Select   | P1, P2, P3 |

  Scenario: View Board in Table View
    When I select "Table view" from the view switcher
    Then I should see a table with columns for "Name", "Objective", "Status", "Department", and "Priority"
    And I should see the toolbar with "Properties", "Group by", "Filter", "Sort", "Search", and "New" options
    And I should see a summary count at the bottom matching the total number of cards

  Scenario: Group by Objective
    Given I am in "Table view"
    When I enable "Group by: Objective"
    Then the table should be divided into groups based on the "Objective" property
    And I should see a group header "Grow Revenue" with "3" items
    And I should see a group header "Delight Customers" with "3" items
    And I should see a group header "Drive Product Adoption" with "2" items
    And the total count at the bottom should be "8"

  Scenario: View Items in "Grow Revenue" Group
    Given the table is grouped by "Objective"
    When I look at the "Grow Revenue" group
    Then I should see the following items:
      | Name | Status | Department | Priority |
      | Add 10 new customers in the EU | AT RISK | SALES | P3 |
      | Generate more Marketing Qualified Leads (MQLs) | IN PROGRESS | MARKETING | P2 |
      | Hit company global sales target | NOT STARTED | SALES | P1 |

  Scenario: View Items in "Delight Customers" Group
    Given the table is grouped by "Objective"
    When I look at the "Delight Customers" group
    Then I should see the following items:
      | Name | Status | Department | Priority |
      | Improve customer NPS score | IN PROGRESS | SUPPORT | P2 |
      | Increase customer retention | IN PROGRESS | PRODUCT | P1 |
      | Reduce bug backlog by 50% | COMPLETE | ENGINEERING | P3 |

  Scenario: Inline Editing
    Given I am in "Table view"
    When I click on the "Status" cell for "Improve customer NPS score"
    Then I should be able to change the status from "IN PROGRESS" to "COMPLETE"

  Scenario: Add New Item to Group
    Given I am in "Table view"
    And the table is grouped by "Objective"
    When I click the "+" button in the "Drive Product Adoption" group header
    Then a new row should be added to the "Drive Product Adoption" group
    And the "Objective" property for the new item should be automatically set to "Drive Product Adoption"

  Scenario: Toolbar Actions
    Given I am in "Table view"
    When I click "Filter"
    Then I should be able to filter cards by "Status", "Department", or "Priority"
    When I click "Sort"
    Then I should be able to sort the table by "Name" or "Priority"
    When I enter text in the "Search cards" box
    Then the table should only show cards matching the search text
    When I click the "New" button
    Then a new card should be added to the top of the list or the current group