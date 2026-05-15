CREATE TABLE `speech_translations` (
	`speech_id` text NOT NULL,
	`locale` text NOT NULL,
	`text_excerpt` text NOT NULL,
	`text_full` text NOT NULL,
	`source_hash` text NOT NULL,
	`model` text NOT NULL,
	`prompt_version` text NOT NULL,
	`translated_at` text NOT NULL,
	PRIMARY KEY(`speech_id`, `locale`),
	FOREIGN KEY (`speech_id`) REFERENCES `speeches`(`id`) ON UPDATE no action ON DELETE no action
);
