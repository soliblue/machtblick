CREATE TABLE IF NOT EXISTS parties (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  list_type TEXT NOT NULL,
  list_scope TEXT NOT NULL,
  programme_status TEXT NOT NULL,
  programme_url TEXT,
  candidate_coverage TEXT NOT NULL,
  candidate_url TEXT,
  color TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS candidates (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  party_slug TEXT NOT NULL REFERENCES parties(slug),
  candidacy_type TEXT NOT NULL,
  list_position INTEGER,
  district TEXT,
  constituency INTEGER,
  source_status TEXT NOT NULL,
  source_url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  publisher TEXT NOT NULL,
  publication_date TEXT,
  retrieved_at TEXT NOT NULL,
  UNIQUE (kind, url)
);

CREATE TABLE IF NOT EXISTS candidate_candidacies (
  id TEXT PRIMARY KEY,
  candidate_slug TEXT NOT NULL REFERENCES candidates(slug) ON DELETE CASCADE,
  candidacy_type TEXT NOT NULL,
  list_position INTEGER,
  district TEXT,
  constituency INTEGER,
  source_id TEXT NOT NULL REFERENCES sources(id)
);

CREATE TABLE IF NOT EXISTS candidate_profiles (
  candidate_slug TEXT PRIMARY KEY REFERENCES candidates(slug) ON DELETE CASCADE,
  occupation TEXT,
  birth_year INTEGER,
  biography_summary TEXT,
  priorities_json TEXT NOT NULL,
  source_id TEXT NOT NULL REFERENCES sources(id),
  retrieved_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS candidate_portraits (
  candidate_slug TEXT PRIMARY KEY REFERENCES candidates(slug) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  author TEXT,
  license TEXT,
  license_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('licensed', 'official_source')),
  provenance TEXT NOT NULL,
  source_id TEXT NOT NULL REFERENCES sources(id),
  retrieved_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS candidate_links (
  id TEXT PRIMARY KEY,
  candidate_slug TEXT NOT NULL REFERENCES candidates(slug) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  source_id TEXT NOT NULL REFERENCES sources(id)
);

CREATE TABLE IF NOT EXISTS programmes (
  party_slug TEXT PRIMARY KEY REFERENCES parties(slug) ON DELETE CASCADE,
  status TEXT NOT NULL,
  title TEXT NOT NULL,
  publication_date TEXT,
  summary TEXT NOT NULL,
  source_id TEXT NOT NULL REFERENCES sources(id),
  retrieved_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS programme_topics (
  party_slug TEXT NOT NULL REFERENCES programmes(party_slug) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  positions_json TEXT NOT NULL,
  source_id TEXT NOT NULL REFERENCES sources(id),
  sort_order INTEGER NOT NULL,
  PRIMARY KEY (party_slug, slug)
);

CREATE TABLE IF NOT EXISTS programme_topic_categories (
  party_slug TEXT NOT NULL,
  topic_slug TEXT NOT NULL,
  category TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  PRIMARY KEY (party_slug, topic_slug, category),
  FOREIGN KEY (party_slug, topic_slug) REFERENCES programme_topics(party_slug, slug) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS programme_documents (
  id TEXT PRIMARY KEY,
  party_slug TEXT NOT NULL REFERENCES programmes(party_slug) ON DELETE CASCADE,
  format TEXT NOT NULL,
  kind TEXT NOT NULL,
  embeddable INTEGER NOT NULL DEFAULT 1,
  source_id TEXT NOT NULL REFERENCES sources(id),
  sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS candidates_party_slug_idx ON candidates(party_slug);
CREATE INDEX IF NOT EXISTS candidate_candidacies_candidate_slug_idx ON candidate_candidacies(candidate_slug);
CREATE INDEX IF NOT EXISTS candidate_profiles_source_id_idx ON candidate_profiles(source_id);
CREATE INDEX IF NOT EXISTS candidate_portraits_source_id_idx ON candidate_portraits(source_id);
CREATE INDEX IF NOT EXISTS candidate_links_candidate_slug_idx ON candidate_links(candidate_slug);
CREATE INDEX IF NOT EXISTS programme_topics_party_slug_idx ON programme_topics(party_slug);
CREATE INDEX IF NOT EXISTS programme_topic_categories_category_idx ON programme_topic_categories(category);
CREATE INDEX IF NOT EXISTS programme_documents_party_slug_idx ON programme_documents(party_slug);
