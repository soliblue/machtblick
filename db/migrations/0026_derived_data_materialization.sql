ALTER TABLE `antraege` ADD `abstract_plain` text;--> statement-breakpoint
CREATE TABLE `plenary_agenda_items` (
	`session_id` text NOT NULL,
	`date` text NOT NULL,
	`agenda_item` text NOT NULL,
	`source_title` text NOT NULL,
	`title` text NOT NULL,
	`source_url` text NOT NULL,
	`review_status` text DEFAULT 'unreviewed' NOT NULL,
	PRIMARY KEY(`session_id`, `agenda_item`)
);
--> statement-breakpoint
CREATE INDEX `plenary_agenda_items_date_agenda_idx` ON `plenary_agenda_items` (`date`,`agenda_item`);--> statement-breakpoint
CREATE TABLE `speech_vote_links` (
	`speech_id` text PRIMARY KEY NOT NULL,
	`vote_id` text NOT NULL,
	`source` text NOT NULL,
	`confidence` integer NOT NULL,
	`review_status` text DEFAULT 'unreviewed' NOT NULL,
	FOREIGN KEY (`speech_id`) REFERENCES `speeches`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`vote_id`) REFERENCES `votes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `speech_vote_links_vote_idx` ON `speech_vote_links` (`vote_id`);--> statement-breakpoint
CREATE TABLE `speech_debate_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`date` text NOT NULL,
	`agenda_item` text NOT NULL,
	`title` text NOT NULL,
	`source` text NOT NULL,
	`review_status` text DEFAULT 'unreviewed' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `speech_debate_groups_session_agenda_idx` ON `speech_debate_groups` (`session_id`,`agenda_item`);--> statement-breakpoint
CREATE INDEX `speech_debate_groups_date_agenda_idx` ON `speech_debate_groups` (`date`,`agenda_item`);--> statement-breakpoint
CREATE TABLE `speech_debate_group_speeches` (
	`group_id` text NOT NULL,
	`speech_id` text NOT NULL,
	`position` integer NOT NULL,
	`contribution_type` text NOT NULL,
	PRIMARY KEY(`group_id`, `speech_id`),
	FOREIGN KEY (`group_id`) REFERENCES `speech_debate_groups`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`speech_id`) REFERENCES `speeches`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `speech_debate_group_speeches_speech_id_unique` ON `speech_debate_group_speeches` (`speech_id`);--> statement-breakpoint
CREATE INDEX `speech_debate_group_speeches_speech_idx` ON `speech_debate_group_speeches` (`speech_id`);--> statement-breakpoint
CREATE TABLE `vote_debate_groups` (
	`vote_id` text NOT NULL,
	`group_id` text NOT NULL,
	`source` text NOT NULL,
	`review_status` text DEFAULT 'unreviewed' NOT NULL,
	PRIMARY KEY(`vote_id`, `group_id`),
	FOREIGN KEY (`vote_id`) REFERENCES `votes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`group_id`) REFERENCES `speech_debate_groups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `vote_debate_groups_group_idx` ON `vote_debate_groups` (`group_id`);--> statement-breakpoint
CREATE TABLE `vote_document_roles` (
	`vote_id` text NOT NULL,
	`document_id` integer NOT NULL,
	`role` text NOT NULL,
	`source` text NOT NULL,
	`review_status` text DEFAULT 'unreviewed' NOT NULL,
	PRIMARY KEY(`vote_id`, `document_id`, `role`),
	FOREIGN KEY (`vote_id`) REFERENCES `votes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`document_id`) REFERENCES `vote_documents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `vote_document_roles_document_idx` ON `vote_document_roles` (`document_id`);--> statement-breakpoint
CREATE INDEX `vote_document_roles_vote_role_idx` ON `vote_document_roles` (`vote_id`,`role`);--> statement-breakpoint
CREATE TABLE `party_aliases` (
	`alias` text PRIMARY KEY NOT NULL,
	`canonical_party` text NOT NULL,
	`source` text NOT NULL,
	`review_status` text DEFAULT 'unreviewed' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `party_aliases_canonical_idx` ON `party_aliases` (`canonical_party`);
