CREATE TABLE `member_affiliations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` text NOT NULL,
	`party` text NOT NULL,
	`valid_from` text NOT NULL,
	`valid_to` text,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `member_affiliations_current_idx` ON `member_affiliations` (`member_id`,`valid_to`);--> statement-breakpoint
CREATE UNIQUE INDEX `member_affiliations_member_id_valid_from_unique` ON `member_affiliations` (`member_id`,`valid_from`);