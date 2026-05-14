CREATE TABLE `antraege` (
	`id` integer PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`abstract` text,
	`beratungsstand` text,
	`wahlperiode` integer NOT NULL,
	`initiative_fraktion` text,
	`introduced_date` text,
	`drucksache` text,
	`drucksache_pdf_url` text,
	`sachgebiet` text,
	`deskriptor` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE INDEX `antraege_type_idx` ON `antraege` (`type`);--> statement-breakpoint
CREATE INDEX `antraege_introduced_date_idx` ON `antraege` (`introduced_date`);--> statement-breakpoint
CREATE INDEX `antraege_drucksache_idx` ON `antraege` (`drucksache`);--> statement-breakpoint
CREATE TABLE `antraege_raw` (
	`antrag_id` integer PRIMARY KEY NOT NULL,
	`vorgang_json` text NOT NULL,
	`positions_json` text NOT NULL,
	`fetched_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `antrag_signatories` (
	`antrag_id` integer NOT NULL,
	`member_id` text NOT NULL,
	`dip_person_id` integer NOT NULL,
	PRIMARY KEY(`antrag_id`, `member_id`),
	FOREIGN KEY (`antrag_id`) REFERENCES `antraege`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `antrag_signatories_member_idx` ON `antrag_signatories` (`member_id`);--> statement-breakpoint
CREATE TABLE `vote_antraege` (
	`vote_id` text NOT NULL,
	`antrag_id` integer NOT NULL,
	PRIMARY KEY(`vote_id`, `antrag_id`),
	FOREIGN KEY (`vote_id`) REFERENCES `votes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`antrag_id`) REFERENCES `antraege`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `vote_antraege_antrag_idx` ON `vote_antraege` (`antrag_id`);