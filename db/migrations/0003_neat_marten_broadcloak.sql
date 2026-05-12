CREATE TABLE `party_donations` (
	`id` text PRIMARY KEY NOT NULL,
	`party` text NOT NULL,
	`donor` text NOT NULL,
	`donor_address` text,
	`amount_eur` integer NOT NULL,
	`date_received` text NOT NULL,
	`date_notified` text NOT NULL,
	`source_url` text NOT NULL
);
