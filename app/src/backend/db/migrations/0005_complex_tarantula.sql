CREATE TABLE `admin_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`value_type` text NOT NULL,
	`default_value` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`is_public` integer DEFAULT false NOT NULL,
	`constraints` text DEFAULT '{}',
	`modified_by` text,
	`create_at` integer NOT NULL,
	`update_at` integer NOT NULL,
	FOREIGN KEY (`modified_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_admin_settings_category` ON `admin_settings` (`category`);--> statement-breakpoint
CREATE INDEX `idx_admin_settings_is_public` ON `admin_settings` (`is_public`);--> statement-breakpoint
CREATE TABLE `admin_settings_history` (
	`id` text NOT NULL,
	`category` text NOT NULL,
	`key` text NOT NULL,
	`old_value` text,
	`new_value` text NOT NULL,
	`changed_by` text NOT NULL,
	`changed_at` integer NOT NULL,
	`reason` text DEFAULT '',
	FOREIGN KEY (`changed_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_admin_settings_history_id` ON `admin_settings_history` (`id`);--> statement-breakpoint
CREATE INDEX `idx_admin_settings_history_changed_at` ON `admin_settings_history` (`changed_at`);