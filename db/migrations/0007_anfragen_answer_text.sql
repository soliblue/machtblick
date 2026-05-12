CREATE TABLE `anfragen_answer_text` (
	`anfrage_id` integer PRIMARY KEY NOT NULL,
	`text` text NOT NULL,
	`extracted_at` text NOT NULL,
	`source` text NOT NULL,
	FOREIGN KEY (`anfrage_id`) REFERENCES `anfragen`(`id`) ON UPDATE no action ON DELETE no action
);
