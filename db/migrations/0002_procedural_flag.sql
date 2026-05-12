ALTER TABLE `votes` ADD `procedural` integer DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE `votes` SET `procedural` = 1 WHERE
  `title` LIKE 'Federführung%' OR
  `title` LIKE 'Überweisung%' OR
  `title` LIKE 'Ausschussüberweisung%' OR
  `title` LIKE 'Überweisungsvorschlag%' OR
  `title` LIKE 'Erneute Überweisung%' OR
  `title` LIKE 'Wahl %' OR
  `title` LIKE 'Wahl der%' OR
  `title` LIKE 'Wahl von%' OR
  `title` LIKE 'Wahl Stiftungsrat%' OR
  `title` LIKE 'Wahl Kuratorium%' OR
  `title` LIKE 'Bestellung %' OR
  `title` LIKE 'Benennung %' OR
  `title` LIKE 'Abberufung %';
