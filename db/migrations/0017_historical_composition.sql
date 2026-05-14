CREATE TABLE `bundestag_terms` (
	`id` integer PRIMARY KEY NOT NULL,
	`number` integer NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text,
	`total_seats` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bundestag_terms_number_unique` ON `bundestag_terms` (`number`);--> statement-breakpoint
CREATE TABLE `party_lineage_events` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`type` text NOT NULL,
	`label_de` text NOT NULL,
	`lineage_id` text NOT NULL,
	`related_lineage_id` text,
	FOREIGN KEY (`lineage_id`) REFERENCES `party_lineages`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`related_lineage_id`) REFERENCES `party_lineages`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `party_lineage_events_lineage_idx` ON `party_lineage_events` (`lineage_id`);--> statement-breakpoint
CREATE TABLE `party_lineage_members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lineage_id` text NOT NULL,
	`party_name` text NOT NULL,
	`valid_from` text NOT NULL,
	`valid_to` text,
	FOREIGN KEY (`lineage_id`) REFERENCES `party_lineages`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `party_lineage_members_party_name_idx` ON `party_lineage_members` (`party_name`);--> statement-breakpoint
CREATE UNIQUE INDEX `party_lineage_members_lineage_id_party_name_valid_from_unique` ON `party_lineage_members` (`lineage_id`,`party_name`,`valid_from`);--> statement-breakpoint
CREATE TABLE `party_lineages` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`current_party_id` text
);
--> statement-breakpoint
CREATE TABLE `party_seat_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`term_id` integer NOT NULL,
	`party_name` text NOT NULL,
	`seats` integer NOT NULL,
	`pct_of_total` real NOT NULL,
	`lineage_id` text,
	FOREIGN KEY (`term_id`) REFERENCES `bundestag_terms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lineage_id`) REFERENCES `party_lineages`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `party_seat_history_lineage_idx` ON `party_seat_history` (`lineage_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `party_seat_history_term_id_party_name_unique` ON `party_seat_history` (`term_id`,`party_name`);