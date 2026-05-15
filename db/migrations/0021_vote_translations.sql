CREATE TABLE `vote_party_summary_translations` (
	`vote_id` text NOT NULL,
	`party` text NOT NULL,
	`locale` text NOT NULL,
	`position_summary` text,
	`key_points` text,
	`dissent_note` text,
	`source_hash` text NOT NULL,
	`model` text NOT NULL,
	`prompt_version` text NOT NULL,
	`translated_at` text NOT NULL,
	PRIMARY KEY(`vote_id`, `party`, `locale`),
	FOREIGN KEY (`vote_id`) REFERENCES `votes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `vote_translations` (
	`vote_id` text NOT NULL,
	`locale` text NOT NULL,
	`title` text NOT NULL,
	`clean_title` text,
	`topic` text,
	`subject` text,
	`summary` text,
	`summary_simplified` text,
	`summary_detail` text,
	`source_hash` text NOT NULL,
	`model` text NOT NULL,
	`prompt_version` text NOT NULL,
	`translated_at` text NOT NULL,
	PRIMARY KEY(`vote_id`, `locale`),
	FOREIGN KEY (`vote_id`) REFERENCES `votes`(`id`) ON UPDATE no action ON DELETE no action
);
