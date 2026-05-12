PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_vote_party_summaries` (
	`vote_id` text NOT NULL,
	`party` text NOT NULL,
	`position` text DEFAULT 'mixed' NOT NULL,
	`members` integer,
	`yes` integer,
	`no` integer,
	`abstain` integer,
	`absent` integer,
	PRIMARY KEY(`vote_id`, `party`),
	FOREIGN KEY (`vote_id`) REFERENCES `votes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_vote_party_summaries`("vote_id", "party", "position", "members", "yes", "no", "abstain", "absent") SELECT "vote_id", "party", CASE WHEN "yes" > "no" AND "yes" > "abstain" THEN 'yes' WHEN "no" > "yes" AND "no" > "abstain" THEN 'no' WHEN "abstain" > "yes" AND "abstain" > "no" THEN 'abstain' ELSE 'mixed' END, "members", "yes", "no", "abstain", "absent" FROM `vote_party_summaries`;--> statement-breakpoint
DROP TABLE `vote_party_summaries`;--> statement-breakpoint
ALTER TABLE `__new_vote_party_summaries` RENAME TO `vote_party_summaries`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_votes` (
	`id` text PRIMARY KEY NOT NULL,
	`bundestag_id` integer,
	`vote_type` text DEFAULT 'namentlich' NOT NULL,
	`date` text NOT NULL,
	`title` text NOT NULL,
	`topic` text,
	`subject` text,
	`summary` text,
	`document` text,
	`result` text NOT NULL,
	`total_members` integer,
	`yes` integer,
	`no` integer,
	`abstain` integer,
	`absent` integer,
	`source_url` text NOT NULL,
	`context_json` text,
	`procedure_json` text,
	`fetched_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_votes`("id", "bundestag_id", "vote_type", "date", "title", "topic", "subject", "summary", "document", "result", "total_members", "yes", "no", "abstain", "absent", "source_url", "context_json", "procedure_json", "fetched_at") SELECT "id", "bundestag_id", 'namentlich', "date", "title", "topic", "subject", "summary", "document", "result", "total_members", "yes", "no", "abstain", "absent", "source_url", "context_json", "procedure_json", "fetched_at" FROM `votes`;--> statement-breakpoint
DROP TABLE `votes`;--> statement-breakpoint
ALTER TABLE `__new_votes` RENAME TO `votes`;--> statement-breakpoint
CREATE UNIQUE INDEX `votes_bundestag_id_unique` ON `votes` (`bundestag_id`);