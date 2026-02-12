ALTER TABLE `file_info` ADD `block_id` text REFERENCES blocks(id);--> statement-breakpoint
ALTER TABLE `file_info` ADD `uploaded_by` text REFERENCES user(id);--> statement-breakpoint
ALTER TABLE `file_info` ADD `uploaded_at` integer;--> statement-breakpoint
CREATE INDEX `idx_file_info_block_id` ON `file_info` (`block_id`);