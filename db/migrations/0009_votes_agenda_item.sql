ALTER TABLE `votes` ADD `agenda_item` text;--> statement-breakpoint
CREATE INDEX `votes_session_agenda_idx` ON `votes` (`agenda_item`);
