-- Create spaces table
CREATE TABLE IF NOT EXISTS `spaces` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`createdAt` text NOT NULL
);

-- Add spaceId column to chats table
ALTER TABLE `chats` ADD `spaceId` text REFERENCES spaces(id) ON DELETE SET NULL;

-- Create index on chats.spaceId
CREATE INDEX IF NOT EXISTS `chats_space_id_idx` ON `chats` (`spaceId`);
