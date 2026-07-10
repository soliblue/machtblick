export function ensureSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS mp_parties (
      parliament TEXT NOT NULL,
      slug TEXT NOT NULL,
      name TEXT NOT NULL,
      short_name TEXT NOT NULL,
      color TEXT,
      seats INTEGER,
      member_count INTEGER,
      PRIMARY KEY (parliament, slug)
    );

    CREATE TABLE IF NOT EXISTS mp_members (
      parliament TEXT NOT NULL,
      id TEXT NOT NULL,
      name TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      party TEXT,
      national_party TEXT,
      country TEXT,
      state TEXT,
      picture_url TEXT,
      picture_license TEXT,
      PRIMARY KEY (parliament, id)
    );
    CREATE INDEX IF NOT EXISTS mp_members_party_idx ON mp_members (parliament, party);
    CREATE INDEX IF NOT EXISTS mp_members_country_idx ON mp_members (parliament, country);

    CREATE TABLE IF NOT EXISTS mp_votes (
      parliament TEXT NOT NULL,
      id TEXT NOT NULL,
      date TEXT NOT NULL,
      title TEXT NOT NULL,
      title_de TEXT,
      description TEXT,
      reference TEXT,
      procedure_reference TEXT,
      result TEXT NOT NULL,
      yes INTEGER,
      no INTEGER,
      abstain INTEGER,
      absent INTEGER,
      total_members INTEGER,
      source_url TEXT NOT NULL,
      PRIMARY KEY (parliament, id)
    );
    CREATE INDEX IF NOT EXISTS mp_votes_date_idx ON mp_votes (parliament, date);

    CREATE TABLE IF NOT EXISTS mp_member_votes (
      parliament TEXT NOT NULL,
      vote_id TEXT NOT NULL,
      member_id TEXT NOT NULL,
      choice TEXT NOT NULL,
      PRIMARY KEY (parliament, vote_id, member_id)
    );
    CREATE INDEX IF NOT EXISTS mp_member_votes_member_idx ON mp_member_votes (parliament, member_id);

    CREATE TABLE IF NOT EXISTS mp_vote_party_summaries (
      parliament TEXT NOT NULL,
      vote_id TEXT NOT NULL,
      party TEXT NOT NULL,
      position TEXT NOT NULL DEFAULT 'mixed',
      yes INTEGER,
      no INTEGER,
      abstain INTEGER,
      absent INTEGER,
      members INTEGER,
      PRIMARY KEY (parliament, vote_id, party)
    );
  `)
}
