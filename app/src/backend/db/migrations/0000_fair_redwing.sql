CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `blocks` (
	`id` text PRIMARY KEY NOT NULL,
	`parent_id` text DEFAULT '' NOT NULL,
	`created_by` text DEFAULT '' NOT NULL,
	`modified_by` text DEFAULT '' NOT NULL,
	`schema` integer DEFAULT 0 NOT NULL,
	`type` text DEFAULT '' NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`fields` text DEFAULT '{}' NOT NULL,
	`board_id` text DEFAULT '' NOT NULL,
	`create_at` integer DEFAULT 0 NOT NULL,
	`update_at` integer DEFAULT 0 NOT NULL,
	`delete_at` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_blocks_board_id` ON `blocks` (`board_id`);--> statement-breakpoint
CREATE INDEX `idx_blocks_parent_id` ON `blocks` (`parent_id`);--> statement-breakpoint
CREATE INDEX `idx_blocks_type` ON `blocks` (`type`);--> statement-breakpoint
CREATE INDEX `idx_blocks_board_id_parent_id` ON `blocks` (`board_id`,`parent_id`);--> statement-breakpoint
CREATE TABLE `blocks_history` (
	`id` text NOT NULL,
	`parent_id` text DEFAULT '' NOT NULL,
	`created_by` text DEFAULT '' NOT NULL,
	`modified_by` text DEFAULT '' NOT NULL,
	`schema` integer DEFAULT 0 NOT NULL,
	`type` text DEFAULT '' NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`fields` text DEFAULT '{}' NOT NULL,
	`board_id` text DEFAULT '' NOT NULL,
	`create_at` integer DEFAULT 0 NOT NULL,
	`update_at` integer DEFAULT 0 NOT NULL,
	`delete_at` integer DEFAULT 0 NOT NULL,
	`insert_at` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_blocks_history_id` ON `blocks_history` (`id`);--> statement-breakpoint
CREATE INDEX `idx_blocks_history_board_id` ON `blocks_history` (`board_id`);--> statement-breakpoint
CREATE INDEX `idx_blocks_history_insert_at` ON `blocks_history` (`insert_at`);--> statement-breakpoint
CREATE TABLE `board_members` (
	`board_id` text NOT NULL,
	`user_id` text NOT NULL,
	`roles` text DEFAULT '' NOT NULL,
	`minimum_role` text DEFAULT '' NOT NULL,
	`scheme_admin` integer DEFAULT false NOT NULL,
	`scheme_editor` integer DEFAULT false NOT NULL,
	`scheme_commenter` integer DEFAULT false NOT NULL,
	`scheme_viewer` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_board_members_user_id` ON `board_members` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_board_members_board_id` ON `board_members` (`board_id`);--> statement-breakpoint
CREATE TABLE `board_members_history` (
	`board_id` text NOT NULL,
	`user_id` text NOT NULL,
	`action` text DEFAULT '' NOT NULL,
	`insert_at` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_board_members_history_board_id` ON `board_members_history` (`board_id`);--> statement-breakpoint
CREATE INDEX `idx_board_members_history_user_id` ON `board_members_history` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_board_members_history_insert_at` ON `board_members_history` (`insert_at`);--> statement-breakpoint
CREATE TABLE `boards` (
	`id` text PRIMARY KEY NOT NULL,
	`team_id` text DEFAULT '' NOT NULL,
	`channel_id` text DEFAULT '' NOT NULL,
	`created_by` text DEFAULT '' NOT NULL,
	`modified_by` text DEFAULT '' NOT NULL,
	`type` text DEFAULT '' NOT NULL,
	`minimum_role` text DEFAULT '' NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`icon` text DEFAULT '' NOT NULL,
	`show_description` integer DEFAULT false NOT NULL,
	`is_template` integer DEFAULT false NOT NULL,
	`template_version` integer DEFAULT 0 NOT NULL,
	`properties` text DEFAULT '{}' NOT NULL,
	`card_properties` text DEFAULT '[]' NOT NULL,
	`create_at` integer DEFAULT 0 NOT NULL,
	`update_at` integer DEFAULT 0 NOT NULL,
	`delete_at` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_boards_team_id` ON `boards` (`team_id`);--> statement-breakpoint
CREATE INDEX `idx_boards_channel_id` ON `boards` (`channel_id`);--> statement-breakpoint
CREATE INDEX `idx_boards_is_template` ON `boards` (`is_template`);--> statement-breakpoint
CREATE TABLE `boards_history` (
	`id` text NOT NULL,
	`team_id` text DEFAULT '' NOT NULL,
	`channel_id` text DEFAULT '' NOT NULL,
	`created_by` text DEFAULT '' NOT NULL,
	`modified_by` text DEFAULT '' NOT NULL,
	`type` text DEFAULT '' NOT NULL,
	`minimum_role` text DEFAULT '' NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`icon` text DEFAULT '' NOT NULL,
	`show_description` integer DEFAULT false NOT NULL,
	`is_template` integer DEFAULT false NOT NULL,
	`template_version` integer DEFAULT 0 NOT NULL,
	`properties` text DEFAULT '{}' NOT NULL,
	`card_properties` text DEFAULT '[]' NOT NULL,
	`create_at` integer DEFAULT 0 NOT NULL,
	`update_at` integer DEFAULT 0 NOT NULL,
	`delete_at` integer DEFAULT 0 NOT NULL,
	`insert_at` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_boards_history_id` ON `boards_history` (`id`);--> statement-breakpoint
CREATE INDEX `idx_boards_history_team_id` ON `boards_history` (`team_id`);--> statement-breakpoint
CREATE INDEX `idx_boards_history_insert_at` ON `boards_history` (`insert_at`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`user_id` text DEFAULT '' NOT NULL,
	`team_id` text DEFAULT '' NOT NULL,
	`create_at` integer DEFAULT 0 NOT NULL,
	`update_at` integer DEFAULT 0 NOT NULL,
	`delete_at` integer DEFAULT 0 NOT NULL,
	`collapsed` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`sorting` text DEFAULT '' NOT NULL,
	`type` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_categories_user_id` ON `categories` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_categories_team_id` ON `categories` (`team_id`);--> statement-breakpoint
CREATE INDEX `idx_categories_user_team` ON `categories` (`user_id`,`team_id`);--> statement-breakpoint
CREATE TABLE `category_boards` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text DEFAULT '' NOT NULL,
	`category_id` text DEFAULT '' NOT NULL,
	`board_id` text DEFAULT '' NOT NULL,
	`hidden` integer DEFAULT false NOT NULL,
	`create_at` integer DEFAULT 0 NOT NULL,
	`update_at` integer DEFAULT 0 NOT NULL,
	`delete_at` integer DEFAULT 0 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_category_boards_category_id` ON `category_boards` (`category_id`);--> statement-breakpoint
CREATE INDEX `idx_category_boards_board_id` ON `category_boards` (`board_id`);--> statement-breakpoint
CREATE INDEX `idx_category_boards_user_id` ON `category_boards` (`user_id`);--> statement-breakpoint
CREATE TABLE `file_info` (
	`id` text PRIMARY KEY NOT NULL,
	`create_at` integer DEFAULT 0 NOT NULL,
	`delete_at` integer DEFAULT 0 NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`extension` text DEFAULT '' NOT NULL,
	`size` integer DEFAULT 0 NOT NULL,
	`archived` integer DEFAULT false NOT NULL,
	`path` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_file_info_create_at` ON `file_info` (`create_at`);--> statement-breakpoint
CREATE TABLE `notification_hints` (
	`block_type` text NOT NULL,
	`block_id` text NOT NULL,
	`modified_by_id` text DEFAULT '' NOT NULL,
	`create_at` integer DEFAULT 0 NOT NULL,
	`notify_at` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_notification_hints_block_id` ON `notification_hints` (`block_id`);--> statement-breakpoint
CREATE INDEX `idx_notification_hints_notify_at` ON `notification_hints` (`notify_at`);--> statement-breakpoint
CREATE TABLE `preferences` (
	`userid` text NOT NULL,
	`category` text NOT NULL,
	`name` text NOT NULL,
	`value` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_preferences_user_id` ON `preferences` (`userid`);--> statement-breakpoint
CREATE INDEX `idx_preferences_category` ON `preferences` (`category`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `sharing` (
	`id` text PRIMARY KEY NOT NULL,
	`enabled` integer DEFAULT false NOT NULL,
	`token` text DEFAULT '' NOT NULL,
	`modified_by` text DEFAULT '' NOT NULL,
	`update_at` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`block_type` text NOT NULL,
	`block_id` text NOT NULL,
	`subscriber_type` text NOT NULL,
	`subscriber_id` text NOT NULL,
	`notified_at` integer DEFAULT 0 NOT NULL,
	`create_at` integer DEFAULT 0 NOT NULL,
	`delete_at` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_subscriptions_subscriber_id` ON `subscriptions` (`subscriber_id`);--> statement-breakpoint
CREATE INDEX `idx_subscriptions_block_id` ON `subscriptions` (`block_id`);--> statement-breakpoint
CREATE TABLE `system_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`value` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`signup_token` text DEFAULT '' NOT NULL,
	`settings` text DEFAULT '{}' NOT NULL,
	`modified_by` text DEFAULT '' NOT NULL,
	`update_at` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`username` text DEFAULT '' NOT NULL,
	`nickname` text DEFAULT '' NOT NULL,
	`first_name` text DEFAULT '' NOT NULL,
	`last_name` text DEFAULT '' NOT NULL,
	`is_bot` integer DEFAULT false NOT NULL,
	`is_guest` integer DEFAULT false NOT NULL,
	`roles` text DEFAULT '' NOT NULL,
	`props` text DEFAULT '{}' NOT NULL,
	`create_at` integer DEFAULT 0 NOT NULL,
	`update_at` integer DEFAULT 0 NOT NULL,
	`delete_at` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_user_profiles_username` ON `user_profiles` (`username`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
