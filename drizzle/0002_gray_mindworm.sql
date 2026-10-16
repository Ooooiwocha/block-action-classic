ALTER TABLE `comments` ADD `connection_id` text;--> statement-breakpoint
ALTER TABLE `comments` ADD `browser_id` text;--> statement-breakpoint
ALTER TABLE `comments` ADD `vpn` integer DEFAULT 0 NOT NULL;