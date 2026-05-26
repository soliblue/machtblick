import Database from 'better-sqlite3'
import { fileURLToPath } from 'node:url'
import { readHandzeichenTitleSources } from './handzeichen-title-sources'

const db = new Database(fileURLToPath(new URL('./machtblick.sqlite', import.meta.url)), { readonly: true })

const scalar = (sql: string) => Object.values(db.prepare(sql).get() ?? {})[0] ?? 0
const rows = <T>(sql: string) => db.prepare(sql).all() as T[]

const publicVotes = Number(scalar(`
  SELECT COUNT(*)
  FROM votes
  WHERE term_id = 21 AND procedural = 0 AND vote_type != 'hammelsprung'
`))

const missingCleanTitle = Number(scalar(`
  SELECT COUNT(*)
  FROM votes
  WHERE term_id = 21
    AND procedural = 0
    AND vote_type != 'hammelsprung'
    AND (clean_title IS NULL OR trim(clean_title) = '')
`))

const polarityTitleOverwrites = Number(scalar(`
  SELECT COUNT(*)
  FROM votes v
  INNER JOIN vote_polarity_decisions p ON p.vote_id = v.id
  WHERE p.inverted = 1
    AND p.original_title IS NOT NULL
    AND p.rewritten_title IS NOT NULL
    AND p.original_title != p.rewritten_title
    AND v.title = p.rewritten_title
`))

const badNamentlichSourceUrls = Number(scalar(`
  SELECT COUNT(*)
  FROM votes
  WHERE term_id = 21
    AND vote_type = 'namentlich'
    AND bundestag_id IS NOT NULL
    AND source_url != 'https://www.bundestag.de/parlament/plenum/abstimmung/abstimmung?id=' || bundestag_id
`))

const missingVoteSummariesWithPdf = Number(scalar(`
  SELECT COUNT(*)
  FROM votes v
  WHERE v.term_id = 21
    AND v.procedural = 0
    AND v.vote_type != 'hammelsprung'
    AND v.summary_simplified IS NULL
    AND EXISTS (
      SELECT 1
      FROM vote_documents vd
      WHERE vd.vote_id = v.id
        AND vd.url LIKE '%.pdf%'
    )
`))

const missingVoteSummariesTotal = Number(scalar(`
  SELECT COUNT(*)
  FROM votes v
  WHERE v.term_id = 21
    AND v.procedural = 0
    AND v.vote_type != 'hammelsprung'
    AND v.summary_simplified IS NULL
`))

const handzeichenTitleSources = readHandzeichenTitleSources()
type HandzeichenTitleRow = {
  id: string
  title: string
}

const handzeichenTitleRows = rows<HandzeichenTitleRow>(`
  SELECT id, title
  FROM votes
  WHERE term_id = 21
    AND procedural = 0
    AND vote_type = 'handzeichen'
`)

let missingHandzeichenTitleSources = 0
let handzeichenTitleMismatches = 0
for (const row of handzeichenTitleRows) {
  const sourceTitle = handzeichenTitleSources.get(row.id)
  if (!sourceTitle) missingHandzeichenTitleSources++
  if (sourceTitle && sourceTitle !== row.title) handzeichenTitleMismatches++
}

type PartySummaryRow = {
  voteId: string
  party: string
}

const partyRows = rows<PartySummaryRow>(`
  SELECT v.id AS voteId, s.party
  FROM vote_party_summaries s
  INNER JOIN votes v ON v.id = s.vote_id
  WHERE v.term_id = 21
    AND v.procedural = 0
    AND v.vote_type = 'handzeichen'
    AND s.position_summary IS NULL
`)

const speechRows = db.prepare(`
  SELECT s.word_count AS wordCount
  FROM vote_debate_groups vdg
  INNER JOIN speech_debate_group_speeches sdgs ON sdgs.group_id = vdg.group_id
  INNER JOIN speeches s ON s.id = sdgs.speech_id
  WHERE vdg.vote_id = ?
    AND s.party = ?
    AND (s.speaker_role IS NULL OR s.speaker_role NOT IN ('Präsident', 'Präsidentin', 'Vizepräsident', 'Vizepräsidentin', 'Alterspräsident', 'Alterspräsidentin'))
`)

const directSpeechRows = db.prepare(`
  SELECT word_count AS wordCount
  FROM speeches
  WHERE vote_id = ?
    AND party = ?
    AND (speaker_role IS NULL OR speaker_role NOT IN ('Präsident', 'Präsidentin', 'Vizepräsident', 'Vizepräsidentin', 'Alterspräsident', 'Alterspräsidentin'))
`)

const speechParty: Record<string, string> = {
  'B90/Grüne': 'BÜNDNIS 90/DIE GRÜNEN',
}

let missingSpeechRichPartySummaries = 0
const missingSpeechRichVotes = new Set<string>()
for (const row of partyRows) {
  const party = speechParty[row.party] ?? row.party
  const grouped = speechRows.all(row.voteId, party) as Array<{ wordCount: number | null }>
  const speeches = grouped.length ? grouped : directSpeechRows.all(row.voteId, party) as Array<{ wordCount: number | null }>
  const words = speeches.reduce((sum, speech) => sum + (speech.wordCount ?? 0), 0)
  if (words >= 150) {
    missingSpeechRichPartySummaries++
    missingSpeechRichVotes.add(row.voteId)
  }
}

console.log(`public_votes=${publicVotes}`)
console.log(`missing_clean_title=${missingCleanTitle}`)
console.log(`polarity_title_overwrites=${polarityTitleOverwrites}`)
console.log(`bad_namentlich_source_url=${badNamentlichSourceUrls}`)
console.log(`missing_handzeichen_title_sources=${missingHandzeichenTitleSources}`)
console.log(`handzeichen_title_mismatches=${handzeichenTitleMismatches}`)
console.log(`missing_vote_summaries_with_pdf=${missingVoteSummariesWithPdf}`)
console.log(`missing_vote_summaries_total=${missingVoteSummariesTotal}`)
console.log(`missing_speech_rich_party_summaries=${missingSpeechRichPartySummaries}`)
console.log(`missing_speech_rich_party_summary_votes=${missingSpeechRichVotes.size}`)

const failures = [
  ['missing_clean_title', missingCleanTitle],
  ['polarity_title_overwrites', polarityTitleOverwrites],
  ['bad_namentlich_source_url', badNamentlichSourceUrls],
  ['missing_handzeichen_title_sources', missingHandzeichenTitleSources],
  ['handzeichen_title_mismatches', handzeichenTitleMismatches],
  ['missing_vote_summaries_with_pdf', missingVoteSummariesWithPdf],
  ['missing_speech_rich_party_summaries', missingSpeechRichPartySummaries],
].filter(([, count]) => Number(count) > 0)

for (const [name, count] of failures) console.error(`${name}=${count}`)
db.close()
process.exitCode = failures.length ? 1 : 0
