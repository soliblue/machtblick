CREATE TABLE `mp_parties` (
	`parliament` text NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`short_name` text NOT NULL,
	`color` text,
	`seats` integer,
	`member_count` integer,
	PRIMARY KEY(`parliament`, `slug`)
);
--> statement-breakpoint
CREATE TABLE `mp_members` (
	`parliament` text NOT NULL,
	`id` text NOT NULL,
	`name` text NOT NULL,
	`first_name` text,
	`last_name` text,
	`party` text,
	`national_party` text,
	`country` text,
	`state` text,
	`picture_url` text,
	`picture_license` text,
	PRIMARY KEY(`parliament`, `id`)
);
--> statement-breakpoint
CREATE INDEX `mp_members_party_idx` ON `mp_members` (`parliament`,`party`);--> statement-breakpoint
CREATE INDEX `mp_members_country_idx` ON `mp_members` (`parliament`,`country`);--> statement-breakpoint
CREATE TABLE `mp_votes` (
	`parliament` text NOT NULL,
	`id` text NOT NULL,
	`date` text NOT NULL,
	`title` text NOT NULL,
	`title_de` text,
	`description` text,
	`reference` text,
	`procedure_reference` text,
	`result` text NOT NULL,
	`yes` integer,
	`no` integer,
	`abstain` integer,
	`absent` integer,
	`total_members` integer,
	`source_url` text NOT NULL,
	PRIMARY KEY(`parliament`, `id`)
);
--> statement-breakpoint
CREATE INDEX `mp_votes_date_idx` ON `mp_votes` (`parliament`,`date`);--> statement-breakpoint
CREATE TABLE `mp_member_votes` (
	`parliament` text NOT NULL,
	`vote_id` text NOT NULL,
	`member_id` text NOT NULL,
	`choice` text NOT NULL,
	PRIMARY KEY(`parliament`, `vote_id`, `member_id`)
);
--> statement-breakpoint
CREATE INDEX `mp_member_votes_member_idx` ON `mp_member_votes` (`parliament`,`member_id`);--> statement-breakpoint
CREATE TABLE `mp_vote_party_summaries` (
	`parliament` text NOT NULL,
	`vote_id` text NOT NULL,
	`party` text NOT NULL,
	`position` text DEFAULT 'mixed' NOT NULL,
	`yes` integer,
	`no` integer,
	`abstain` integer,
	`absent` integer,
	`members` integer,
	PRIMARY KEY(`parliament`, `vote_id`, `party`)
);
