ALTER TABLE vote_description_decisions ADD COLUMN model_reasoning_effort text;
--> statement-breakpoint
ALTER TABLE antrag_descriptions ADD COLUMN model_reasoning_effort text;
--> statement-breakpoint
ALTER TABLE vote_party_summary_decisions ADD COLUMN model_reasoning_effort text;
--> statement-breakpoint
ALTER TABLE vote_translations ADD COLUMN model_reasoning_effort text;
--> statement-breakpoint
ALTER TABLE vote_party_summary_translations ADD COLUMN model_reasoning_effort text;
--> statement-breakpoint
ALTER TABLE antrag_description_translations ADD COLUMN model_reasoning_effort text;
--> statement-breakpoint
ALTER TABLE antrag_description_translations ADD COLUMN title_model text;
--> statement-breakpoint
ALTER TABLE antrag_description_translations ADD COLUMN title_model_reasoning_effort text;
--> statement-breakpoint
ALTER TABLE antrag_description_translations ADD COLUMN title_prompt_version text;
--> statement-breakpoint
ALTER TABLE speech_translations ADD COLUMN model_reasoning_effort text;
