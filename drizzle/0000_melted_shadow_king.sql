CREATE TABLE `comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`stage_id` integer NOT NULL,
	`name` text NOT NULL,
	`comment` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_comments_stage_id` ON `comments` (`stage_id`);--> statement-breakpoint
CREATE TABLE `scores` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`stage_id` integer NOT NULL,
	`name` text NOT NULL,
	`time` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_scores_stage_time` ON `scores` (`stage_id`,`time`);--> statement-breakpoint
CREATE TABLE `stages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`name` text NOT NULL,
	`comment` text NOT NULL,
	`cells` text NOT NULL,
	`password` text NOT NULL,
	`valid` integer DEFAULT 1 NOT NULL,
	`demo` integer DEFAULT 0 NOT NULL,
	`created` text NOT NULL,
	`deleted` integer DEFAULT 0 NOT NULL,
	`pn` integer DEFAULT 0 NOT NULL,
	`dn` integer DEFAULT 0 NOT NULL,
	`cn` integer DEFAULT 0 NOT NULL,
	`retn` integer DEFAULT 0 NOT NULL,
	`good` integer DEFAULT 0 NOT NULL,
	`bad` integer DEFAULT 0 NOT NULL
);
