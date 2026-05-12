CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `vote_documents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`vote_id` text NOT NULL,
	`label` text NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	FOREIGN KEY (`vote_id`) REFERENCES `votes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `vote_members` (
	`vote_id` text NOT NULL,
	`member_id` text NOT NULL,
	`party` text NOT NULL,
	`state` text NOT NULL,
	`choice` text NOT NULL,
	PRIMARY KEY(`vote_id`, `member_id`),
	FOREIGN KEY (`vote_id`) REFERENCES `votes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `vote_party_summaries` (
	`vote_id` text NOT NULL,
	`party` text NOT NULL,
	`members` integer NOT NULL,
	`yes` integer NOT NULL,
	`no` integer NOT NULL,
	`abstain` integer NOT NULL,
	`absent` integer NOT NULL,
	PRIMARY KEY(`vote_id`, `party`),
	FOREIGN KEY (`vote_id`) REFERENCES `votes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `votes` (
	`id` text PRIMARY KEY NOT NULL,
	`bundestag_id` integer NOT NULL,
	`date` text NOT NULL,
	`title` text NOT NULL,
	`topic` text,
	`subject` text,
	`summary` text,
	`document` text,
	`result` text NOT NULL,
	`total_members` integer NOT NULL,
	`yes` integer NOT NULL,
	`no` integer NOT NULL,
	`abstain` integer NOT NULL,
	`absent` integer NOT NULL,
	`source_url` text NOT NULL,
	`context_json` text,
	`procedure_json` text,
	`fetched_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `votes_bundestag_id_unique` ON `votes` (`bundestag_id`);