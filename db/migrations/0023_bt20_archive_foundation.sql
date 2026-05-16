CREATE TABLE `member_mandates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` text NOT NULL,
	`term_id` integer NOT NULL,
	`bt_mdb_id` text,
	`aw_politician_id` integer,
	`aw_mandate_id` integer,
	`mandate_type` text,
	`list_state` text,
	`constituency_number` text,
	`constituency_name` text,
	`valid_from` text,
	`valid_to` text,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`term_id`) REFERENCES `bundestag_terms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `member_mandates_term_idx` ON `member_mandates` (`term_id`);--> statement-breakpoint
CREATE INDEX `member_mandates_member_idx` ON `member_mandates` (`member_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `member_mandates_member_id_term_id_valid_from_unique` ON `member_mandates` (`member_id`,`term_id`,`valid_from`);--> statement-breakpoint
DROP INDEX IF EXISTS `member_affiliations_member_id_valid_from_unique`;--> statement-breakpoint
ALTER TABLE `member_affiliations` ADD `term_id` integer DEFAULT 21 NOT NULL REFERENCES bundestag_terms(id);--> statement-breakpoint
CREATE INDEX `member_affiliations_term_idx` ON `member_affiliations` (`term_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `member_affiliations_member_id_term_id_valid_from_unique` ON `member_affiliations` (`member_id`,`term_id`,`valid_from`);--> statement-breakpoint
ALTER TABLE `votes` ADD `term_id` integer DEFAULT 21 NOT NULL REFERENCES bundestag_terms(id);--> statement-breakpoint
CREATE INDEX `votes_term_idx` ON `votes` (`term_id`);
