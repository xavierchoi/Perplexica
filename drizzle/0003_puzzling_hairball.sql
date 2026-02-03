PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_chats` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`createdAt` text NOT NULL,
	`sources` text DEFAULT '[]',
	`files` text DEFAULT '[]'
);
--> statement-breakpoint
INSERT INTO `__new_chats`("id", "title", "createdAt", "sources", "files") SELECT "id", "title", "createdAt", "sources", "files" FROM `chats`;--> statement-breakpoint
DROP TABLE `chats`;--> statement-breakpoint
ALTER TABLE `__new_chats` RENAME TO `chats`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `messages_chat_id_idx` ON `messages` (`chatId`);--> statement-breakpoint
CREATE INDEX `messages_message_id_idx` ON `messages` (`messageId`);--> statement-breakpoint
CREATE INDEX `messages_backend_id_idx` ON `messages` (`backendId`);