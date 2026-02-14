# Attachments

Feature: Attachments Management

  As a user, I want to manage files associated with cards so that I have centralized access to all project assets.

  Background:
    Given I have a board with multiple cards
    And some cards have files attached

  @view
  Scenario: View All Attachments
    Given I am on the board view
    When I select the "Attachments" view
    Then I should see a list of all files attached to any card on the board
    And each file entry should show:
      | Field | Description |
      | File Name | Name of the file |
      | File Type | Icon or extension |
      | Date Added | When it was attached |
      | Source Card | Link to the card it belongs to |
      | Size | File size |

  @manage
  Scenario: Filter Attachments
    Given I am on the "Attachments" view
    When I search for a file by name
    Then the list should only show files matching the search query

  @manage
  Scenario: Sort Attachments
    Given I am on the "Attachments" view
    When I sort the list by "Date Added" descending
    Then the most recently added files should appear at the top

  @manage
  Scenario: Delete Attachment from View
    Given I am on the "Attachments" view
    When I select a file to delete
    And I confirm the deletion
    Then the file should be removed from the list
    And the file should be removed from its source card

  @manage
  Scenario: Navigate to Source Card
    Given I am on the "Attachments" view
    When I click on the source card link for a file
    Then I should be navigated to the detailed view of that card

  @card
  Scenario: Attach File to Card
    Given I am viewing a card in detail view
    When I upload a file named "specs.pdf"
    Then the file "specs.pdf" should appear in the attachments section of the card
    And the file should be visible in the board's "Attachments" view

  @card
  Scenario: Delete Attachment from Card
    Given I am viewing a card with an attachment "specs.pdf"
    When I delete the attachment "specs.pdf"
    Then the file should no longer appear on the card
    And the file should be removed from the "Attachments" view