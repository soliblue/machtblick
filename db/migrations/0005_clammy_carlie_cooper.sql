CREATE TABLE `speeches` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`agenda_item` text,
	`vote_id` text,
	`speaker_member_id` text,
	`speaker_name` text NOT NULL,
	`speaker_role` text,
	`party` text,
	`date` text NOT NULL,
	`position` integer NOT NULL,
	`text_excerpt` text NOT NULL,
	`text_full` text NOT NULL,
	`word_count` integer NOT NULL,
	`source_url` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `speeches_session_idx` ON `speeches` (`session_id`);--> statement-breakpoint
CREATE INDEX `speeches_vote_idx` ON `speeches` (`vote_id`);--> statement-breakpoint
CREATE INDEX `speeches_member_idx` ON `speeches` (`speaker_member_id`);--> statement-breakpoint
CREATE INDEX `speeches_date_idx` ON `speeches` (`date`);--> statement-breakpoint
CREATE VIRTUAL TABLE `speeches_fts` USING fts5(
  speaker_name,
  text_full,
  content='speeches',
  content_rowid='rowid',
  tokenize='unicode61 remove_diacritics 2'
);--> statement-breakpoint
CREATE TRIGGER `speeches_fts_ai` AFTER INSERT ON `speeches` BEGIN
  INSERT INTO speeches_fts(rowid, speaker_name, text_full) VALUES (new.rowid, new.speaker_name, new.text_full);
END;--> statement-breakpoint
CREATE TRIGGER `speeches_fts_ad` AFTER DELETE ON `speeches` BEGIN
  INSERT INTO speeches_fts(speeches_fts, rowid, speaker_name, text_full) VALUES ('delete', old.rowid, old.speaker_name, old.text_full);
END;--> statement-breakpoint
CREATE TRIGGER `speeches_fts_au` AFTER UPDATE ON `speeches` BEGIN
  INSERT INTO speeches_fts(speeches_fts, rowid, speaker_name, text_full) VALUES ('delete', old.rowid, old.speaker_name, old.text_full);
  INSERT INTO speeches_fts(rowid, speaker_name, text_full) VALUES (new.rowid, new.speaker_name, new.text_full);
END;