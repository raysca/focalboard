Feature: Board Members

  As a user, I want to add, remove, and manage board members so that I can collaborate with my team on boards.

  Background:
    Given I am logged in
    And I have access to a board
    And the board has a role system: Admin, Editor, Commenter, Viewer

  Scenario: View Board Members
    Given I am on a board
    When I open the members dialog (e.g. via "Members" button or board menu)
    Then I should see a list of all board members
    And each member should display:
      | Field        | Visible |
      | Avatar/initials | Yes  |
      | Name/username | Yes    |
      | Role          | Yes    |
      | Remove button | Yes (if I have permission) |
    And members should be ordered by role (Admin first) or alphabetically

  Scenario: Add Member (Admin)
    Given I am an Admin on the board
    When I open the members dialog
    And I enter a username or email in the add member input
    And I click "Add" or press Enter
    Then the user should be added as a board member
    And the new member should appear in the list with a default role (e.g. Editor)
    And I should see a success indication (or the list should refresh)

  Scenario: Add Member - User Not Found
    Given I am an Admin on the board
    When I open the members dialog
    And I enter a username or email that does not exist in the system
    And I click "Add"
    Then I should see an error message (e.g. "User not found")
    And the user should not be added to the board

  Scenario: Add Member - Already a Member
    Given I am an Admin on the board
    And the user is already a board member
    When I open the members dialog
    And I enter that user's username or email
    And I click "Add"
    Then I should see an error or the add should be ignored
    And the member list should remain unchanged

  Scenario: Add Member - Permission Denied
    Given I am an Editor, Commenter, or Viewer on the board
    When I open the members dialog
    Then I should not see the add member input and button
    Or I should see them disabled with a tooltip explaining admin-only access

  Scenario: Remove Member (Admin)
    Given I am an Admin on the board
    And there is another member (not the last Admin)
    When I open the members dialog
    And I click the remove (trash) icon next to that member
    Then the member should be removed from the board
    And the member should no longer appear in the list
    And the member should lose access to the board

  Scenario: Remove Member - Cannot Remove Last Admin
    Given I am an Admin on the board
    And I am the only Admin
    When I open the members dialog
    Then I should not be able to remove myself
    Or if I attempt to remove the last Admin, I should see an error (e.g. "Board must have at least one admin")

  Scenario: Remove Member - Permission Denied
    Given I am an Editor, Commenter, or Viewer on the board
    When I open the members dialog
    Then I should not see remove buttons next to other members
    Or the remove action should be disabled

  Scenario: Change Member Role (Admin)
    Given I am an Admin on the board
    When I open the members dialog
    And I change a member's role via the role dropdown
    Then the member's role should be updated
    And the new role should be reflected in the list
    And the member's permissions should change accordingly:
      | Role      | Can view | Can comment | Can edit | Can manage members |
      | Admin     | Yes      | Yes         | Yes      | Yes                 |
      | Editor    | Yes      | Yes         | Yes      | No                  |
      | Commenter | Yes      | Yes         | No       | No                  |
      | Viewer    | Yes      | No          | No       | No                  |

  Scenario: Change Member Role - Permission Denied
    Given I am an Editor, Commenter, or Viewer on the board
    When I open the members dialog
    Then I should not see role dropdowns for other members
    Or the role selector should be read-only/disabled

  Scenario: Leave Board
    Given I am a member of the board (and not the only Admin)
    When I open the board menu or members dialog
    And I select "Leave board"
    Then I should be removed from the board
    And I should be redirected (e.g. to dashboard or board list)
    And I should no longer have access to the board

  Scenario: Leave Board - Last Admin
    Given I am the only Admin on the board
    When I attempt to leave the board
    Then I should see an error or be prevented from leaving
    And I should see a message to transfer admin to another member first
    Or I should be prompted to delete the board instead

  Scenario: Join Open Board
    Given the board is open (public to authenticated users)
    And I am not yet a member
    When I view the board
    Then I should see a "Join board" or similar option
    When I click "Join board"
    Then I should be added as a member (default role: Editor)
    And I should gain full access to the board
    And the "Join board" option should be replaced with board content

  Scenario: Join Open Board - Already a Member
    Given the board is open
    And I am already a member
    When I view the board
    Then I should not see a "Join board" option
    And I should see the board content directly

  Scenario: Members Dialog - Search or Invite
    Given I am an Admin on the board
    When I open the members dialog
    And I focus the add member input
    Then I should be able to search for users by name or email
    And I should see a dropdown of matching users (from the team/workspace)
    And I should be able to select a user to add (instead of typing exact ID)
    And users who are already members may be excluded or indicated

  Scenario: Member Avatars on Board
    Given I am on a board
    When the board header or card shows member avatars
    Then I should see avatars or initials for board members (e.g. in the header)
    And clicking avatars may open the members dialog or show a member tooltip
    And the current user's avatar may be highlighted

  Scenario: Board Type and Membership
    Given the board is private (type "P")
    Then only explicitly added members can access the board
    And there is no "Join board" option for non-members
    Given the board is open (type "O")
    Then any authenticated user can view the board
    And users can join to become members and gain edit access
