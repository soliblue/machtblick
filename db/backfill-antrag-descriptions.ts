import Database from 'better-sqlite3'
import { fileURLToPath } from 'node:url'

const db = new Database(fileURLToPath(new URL('./machtblick.sqlite', import.meta.url)))

db.exec(`
CREATE TABLE IF NOT EXISTS antrag_descriptions (
  antrag_id integer PRIMARY KEY NOT NULL,
  summary_simplified text,
  summary_detail text,
  source_vote_id text,
  source_pdf_url text,
  model text,
  generated_at text,
  prompt_version integer,
  FOREIGN KEY (antrag_id) REFERENCES antraege(id),
  FOREIGN KEY (source_vote_id) REFERENCES votes(id)
);

CREATE TABLE IF NOT EXISTS antrag_description_translations (
  antrag_id integer NOT NULL,
  locale text NOT NULL,
  summary_simplified text,
  summary_detail text,
  source_hash text,
  model text,
  prompt_version text,
  translated_at text,
  PRIMARY KEY(antrag_id, locale),
  FOREIGN KEY (antrag_id) REFERENCES antraege(id)
);
`)

const insertGerman = db.prepare(`
WITH unique_matches AS (
  SELECT a.id AS antrag_id, vdd.vote_id AS vote_id
  FROM antraege a
  INNER JOIN vote_description_decisions vdd ON vdd.drucksache_id = a.drucksache
  WHERE a.wahlperiode = 21
  GROUP BY a.id
  HAVING count(*) = 1
)
INSERT INTO antrag_descriptions (
  antrag_id,
  summary_simplified,
  summary_detail,
  source_vote_id,
  source_pdf_url,
  model,
  generated_at,
  prompt_version
)
SELECT
  m.antrag_id,
  v.summary_simplified,
  v.summary_detail,
  v.id,
  vdd.source_pdf_url,
  vdd.model,
  vdd.generated_at,
  vdd.prompt_version
FROM unique_matches m
INNER JOIN votes v ON v.id = m.vote_id
INNER JOIN vote_description_decisions vdd ON vdd.vote_id = m.vote_id
WHERE v.summary_simplified IS NOT NULL OR v.summary_detail IS NOT NULL
ON CONFLICT(antrag_id) DO UPDATE SET
  summary_simplified = excluded.summary_simplified,
  summary_detail = excluded.summary_detail,
  source_vote_id = excluded.source_vote_id,
  source_pdf_url = excluded.source_pdf_url,
  model = excluded.model,
  generated_at = excluded.generated_at,
  prompt_version = excluded.prompt_version
`)

const insertEnglish = db.prepare(`
WITH unique_matches AS (
  SELECT a.id AS antrag_id, vdd.vote_id AS vote_id
  FROM antraege a
  INNER JOIN vote_description_decisions vdd ON vdd.drucksache_id = a.drucksache
  WHERE a.wahlperiode = 21
  GROUP BY a.id
  HAVING count(*) = 1
)
INSERT INTO antrag_description_translations (
  antrag_id,
  locale,
  summary_simplified,
  summary_detail,
  source_hash,
  model,
  prompt_version,
  translated_at
)
SELECT
  m.antrag_id,
  vt.locale,
  vt.summary_simplified,
  vt.summary_detail,
  vt.source_hash,
  vt.model,
  vt.prompt_version,
  vt.translated_at
FROM unique_matches m
INNER JOIN vote_translations vt ON vt.vote_id = m.vote_id
WHERE vt.locale = 'en'
  AND (vt.summary_simplified IS NOT NULL OR vt.summary_detail IS NOT NULL)
ON CONFLICT(antrag_id, locale) DO UPDATE SET
  summary_simplified = excluded.summary_simplified,
  summary_detail = excluded.summary_detail,
  source_hash = excluded.source_hash,
  model = excluded.model,
  prompt_version = excluded.prompt_version,
  translated_at = excluded.translated_at
`)

const german = insertGerman.run().changes
const english = insertEnglish.run().changes
const totals = db.prepare(`
SELECT
  (SELECT count(*) FROM antrag_descriptions) AS german,
  (SELECT count(*) FROM antrag_description_translations WHERE locale = 'en') AS english
`).get() as { german: number; english: number }

console.log(`Backfilled ${german} German and ${english} English Antrag descriptions. Totals: ${totals.german} German, ${totals.english} English.`)

db.close()
