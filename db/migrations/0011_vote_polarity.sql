ALTER TABLE `votes` ADD `inverted` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE TABLE `vote_polarity_decisions` (
	`vote_id` text PRIMARY KEY NOT NULL,
	`inverted` integer NOT NULL,
	`source` text NOT NULL,
	`confidence` text,
	`reason` text,
	`rewritten_title` text,
	`original_title` text,
	`decided_at` text NOT NULL,
	FOREIGN KEY (`vote_id`) REFERENCES `votes`(`id`) ON UPDATE no action ON DELETE no action
);
