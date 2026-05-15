ALTER TABLE `vote_party_summaries` ADD `position_summary` text;--> statement-breakpoint
ALTER TABLE `vote_party_summaries` ADD `key_points` text;--> statement-breakpoint
ALTER TABLE `vote_party_summaries` ADD `dissent_note` text;--> statement-breakpoint
CREATE TABLE `vote_party_summary_decisions` (
	`vote_id` text NOT NULL,
	`party` text NOT NULL,
	`source_speech_ids` text NOT NULL,
	`model` text NOT NULL,
	`prompt_version` text NOT NULL,
	`generated_at` text NOT NULL,
	PRIMARY KEY(`vote_id`, `party`),
	FOREIGN KEY (`vote_id`, `party`) REFERENCES `vote_party_summaries`(`vote_id`, `party`) ON UPDATE no action ON DELETE no action
);
