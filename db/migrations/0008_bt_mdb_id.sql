ALTER TABLE `members` ADD `bt_mdb_id` text;--> statement-breakpoint
CREATE INDEX `members_bt_mdb_id_idx` ON `members` (`bt_mdb_id`);