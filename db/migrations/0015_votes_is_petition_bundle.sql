ALTER TABLE `votes` ADD `is_petition_bundle` integer DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE `votes` SET `is_petition_bundle` = 1 WHERE `title` LIKE 'Sammelübersicht %';
