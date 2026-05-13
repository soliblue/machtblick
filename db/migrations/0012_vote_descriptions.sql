ALTER TABLE `votes` ADD `summary_simplified` text;--> statement-breakpoint
ALTER TABLE `votes` ADD `summary_detail` text;--> statement-breakpoint
CREATE TABLE `vote_description_decisions` (
	`vote_id` text PRIMARY KEY NOT NULL,
	`drucksache_id` text NOT NULL,
	`source_pdf_url` text NOT NULL,
	`model` text NOT NULL,
	`generated_at` text NOT NULL,
	`prompt_version` integer NOT NULL,
	FOREIGN KEY (`vote_id`) REFERENCES `votes`(`id`) ON UPDATE no action ON DELETE no action
);
