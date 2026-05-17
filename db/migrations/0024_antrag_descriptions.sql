CREATE TABLE `antrag_descriptions` (
	`antrag_id` integer PRIMARY KEY NOT NULL,
	`summary_simplified` text,
	`summary_detail` text,
	`source_vote_id` text,
	`source_pdf_url` text,
	`model` text,
	`generated_at` text,
	`prompt_version` integer,
	FOREIGN KEY (`antrag_id`) REFERENCES `antraege`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_vote_id`) REFERENCES `votes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `antrag_description_translations` (
	`antrag_id` integer NOT NULL,
	`locale` text NOT NULL,
	`summary_simplified` text,
	`summary_detail` text,
	`source_hash` text,
	`model` text,
	`prompt_version` text,
	`translated_at` text,
	PRIMARY KEY(`antrag_id`, `locale`),
	FOREIGN KEY (`antrag_id`) REFERENCES `antraege`(`id`) ON UPDATE no action ON DELETE no action
);
