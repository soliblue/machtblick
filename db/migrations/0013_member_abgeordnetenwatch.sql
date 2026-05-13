CREATE TABLE `member_abgeordnetenwatch` (
	`member_id` text PRIMARY KEY NOT NULL,
	`aw_politician_id` integer NOT NULL,
	`raw_json` text NOT NULL,
	`picture_url` text,
	`fetched_at` text NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
