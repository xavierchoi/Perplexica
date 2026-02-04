CREATE TABLE IF NOT EXISTS `memories` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`content` text NOT NULL,
	`keywords` text DEFAULT '[]',
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	`isActive` integer DEFAULT true
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `memories_type_idx` ON `memories` (`type`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `memories_is_active_idx` ON `memories` (`isActive`);
