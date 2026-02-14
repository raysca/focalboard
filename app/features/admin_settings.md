Feature: Admin Settings

  As an administrator, I want to configure the application settings so that I can control access, manage users, and maintain the system.

  Background:
    Given I am logged in as "Alice"
    And "Alice" has the "admin" role
    And I am on the Admin Settings page

  # Authentication Settings

  Scenario: Enable OAuth Logins
    Given I am on the "Authentication" settings tab
    When I toggle "Enable OAuth Logins" to "On"
    Then I should see options to configure specific providers

  Scenario: Configure Google OAuth
    Given I have enabled OAuth Logins
    When I select "Google" as a provider
    And I enter the "Client ID" and "Client Secret"
    And I click "Save"
    Then users should be able to log in using their Google account

  Scenario: Configure GitHub OAuth
    Given I have enabled OAuth Logins
    When I select "GitHub" as a provider
    And I enter the "Client ID" and "Client Secret"
    And I click "Save"
    Then users should be able to log in using their GitHub account

  Scenario: Enable Email Signups
    Given I am on the "Authentication" settings tab
    When I toggle "Enable Email Signups" to "On"
    Then new users should be able to register using their email and password
    And the registration page should be accessible

  Scenario: Disable Email Signups
    Given I am on the "Authentication" settings tab
    When I toggle "Enable Email Signups" to "Off"
    Then the registration page should be disabled
    And new users should not be able to sign up via email

  Scenario: Enable Magic Link Login
    Given I am on the "Authentication" settings tab
    When I toggle "Enable Magic Links" to "On"
    Then users should be able to request a login link via email
    And clicking the link should log them in without a password

  # User Management

  Scenario: Grant Admin Rights
    Given I am on the "Users" settings tab
    And I see a list of registered users including "Bob"
    When I click "Promote to Admin" for the user "Bob"
    Then "Bob" should have administrator privileges
    And "Bob" should be able to access the Admin Settings page

  Scenario: Revoke Admin Rights
    Given I am on the "Users" settings tab
    And "Bob" is an administrator
    When I click "Revoke Admin" for "Bob"
    Then "Bob" should no longer have administrator privileges
    And "Bob" should not be able to access the Admin Settings page

  Scenario: Prevent Self-Revocation of Admin Rights
    Given I am on the "Users" settings tab
    And I am looking at my own user record ("Alice")
    Then the "Revoke Admin" button should be disabled for "Alice"
    And I should not be able to revoke my own admin rights

  Scenario: Only Admins Can Revoke Rights
    Given I am logged in as "Dave"
    And "Dave" is a standard user
    Then I should not be able to access the Admin Settings page
    And I should not be able to revoke admin rights for any user

  # Board Management

  Scenario: Archive a Board
    Given I am on the "Boards" settings tab
    And I see a list of all boards in the system
    When I click "Archive" for the board "Project X"
    Then the board "Project X" should be moved to the archive
    And it should not appear in the active boards list
    And users should not be able to edit the board

  # System Settings

  Scenario: Enable Maintenance Mode
    Given I am on the "System" settings tab
    When I toggle "Maintenance Mode" to "On"
    Then non-admin users (like "Carol") should see a "Under Maintenance" page when modifying data
    And valid read-only operations might still be allowed
    And admins (like "Alice") should still be able to access the system fully

  Scenario: Configure File Upload Settings
    Given I am on the "System" settings tab
    When I set "Max File Size" to "10 MB"
    And I set "Allowed File Types" to "jpg, png, pdf"
    And I click "Save"
    Then users should not be able to upload files larger than 10MB
    And users should not be able to upload files with extensions other than jpg, png, or pdf
