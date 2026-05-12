CREATE TABLE `anfrage_signatories` (
	`anfrage_id` integer NOT NULL,
	`member_id` text NOT NULL,
	`dip_person_id` integer NOT NULL,
	PRIMARY KEY(`anfrage_id`, `member_id`),
	FOREIGN KEY (`anfrage_id`) REFERENCES `anfragen`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `anfrage_signatories_member_idx` ON `anfrage_signatories` (`member_id`);--> statement-breakpoint
CREATE TABLE `anfragen` (
	`id` integer PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`abstract` text,
	`beratungsstand` text,
	`wahlperiode` integer NOT NULL,
	`initiative_fraktion` text,
	`question_date` text,
	`answer_date` text,
	`question_drucksache` text,
	`answer_drucksache` text,
	`question_pdf_url` text,
	`answer_pdf_url` text,
	`answer_ressort` text,
	`sachgebiet` text,
	`deskriptor` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE INDEX `anfragen_type_idx` ON `anfragen` (`type`);--> statement-breakpoint
CREATE INDEX `anfragen_question_date_idx` ON `anfragen` (`question_date`);--> statement-breakpoint
CREATE TABLE `anfragen_raw` (
	`anfrage_id` integer PRIMARY KEY NOT NULL,
	`vorgang_json` text NOT NULL,
	`positions_json` text NOT NULL,
	`fetched_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `members` ADD `dip_person_id` integer;