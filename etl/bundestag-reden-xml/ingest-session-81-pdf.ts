import Database from 'better-sqlite3'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'

type Marker = {
  marker: string
  speakerName: string
  speakerMemberId: string | null
  speakerRole: string | null
  party: string | null
}

type Segment = Marker & {
  text: string
}

const voteId = '2026-05-22-1004-ablehnung-eines-antrags-zur-arzneimittelversorgung'
const sessionId = '21-81'
const date = '2026-05-22'
const agendaItem = 'Zusatzpunkt 10'
const sourceUrl = 'https://dserver.bundestag.de/btp/21/21081.pdf'
const title = 'Apothekenversorgung und Arzneimittelversorgung'
const force = process.argv.includes('--force')
const dbPath = process.env.MACHTBLICK_DB ?? fileURLToPath(new URL('../../db/machtblick.sqlite', import.meta.url))
const rawDir = fileURLToPath(new URL('./raw/pdf/', import.meta.url))
const pdfPath = join(rawDir, '21081.pdf')
const opening = 'Simone Borchardt (CDU/CSU):'
const closing = 'Ich rufe auf den Tagesordnungspunkt 27:'
const fallbackIdPrefix = 'btp21-081-pdf-zp10'

const markers: Marker[] = [
  { marker: 'Vizepräsident Omid Nouripour:', speakerName: 'Vizepräsident Omid Nouripour', speakerMemberId: null, speakerRole: 'Vizepräsident', party: null },
  { marker: 'Simone Borchardt (CDU/CSU):', speakerName: 'Simone Borchardt', speakerMemberId: 'borchardt-simone', speakerRole: null, party: 'CDU/CSU' },
  { marker: 'Martin Sichert (AfD):', speakerName: 'Martin Sichert', speakerMemberId: 'sichert-martin', speakerRole: null, party: 'AfD' },
  { marker: 'Dr. Paula Piechotta (BÜNDNIS 90/DIE GRÜNEN):', speakerName: 'Dr. Paula Piechotta', speakerMemberId: 'piechotta-paula', speakerRole: null, party: 'B90/Grüne' },
  { marker: 'Dr. Tanja Machalet (SPD):', speakerName: 'Dr. Tanja Machalet', speakerMemberId: 'machalet-tanja', speakerRole: null, party: 'SPD' },
  { marker: 'Ates Gürpinar (Die Linke):', speakerName: 'Ates Gürpinar', speakerMemberId: 'gurpinar-ates', speakerRole: null, party: 'Die Linke' },
  { marker: 'Dr. Stephan Pilsinger (CDU/CSU):', speakerName: 'Dr. Stephan Pilsinger', speakerMemberId: 'pilsinger-stephan', speakerRole: null, party: 'CDU/CSU' },
  { marker: 'Dr. Christoph Birghan (AfD):', speakerName: 'Dr. Christoph Birghan', speakerMemberId: 'birghan-christoph', speakerRole: null, party: 'AfD' },
  { marker: 'Dr. Christos Pantazis (SPD):', speakerName: 'Dr. Christos Pantazis', speakerMemberId: 'pantazis-christos', speakerRole: null, party: 'SPD' },
  { marker: 'Dr. Maria-Lena Weiss (CDU/CSU):', speakerName: 'Dr. Maria-Lena Weiss', speakerMemberId: 'weiss-maria-lena', speakerRole: null, party: 'CDU/CSU' },
]

mkdirSync(rawDir, { recursive: true })
const pdf = await loadPdf()
const text = await extractText(pdf)
const segments = extractSegments(text)
const db = new Database(dbPath)
db.pragma('foreign_keys = ON')

const knownMembers = new Set((db.prepare('SELECT id FROM members').all() as Array<{ id: string }>).map((row) => row.id))
for (const marker of markers.filter((m) => m.speakerMemberId)) {
  if (!knownMembers.has(marker.speakerMemberId!)) throw new Error(`missing member ${marker.speakerMemberId}`)
}
if (!db.prepare('SELECT id FROM votes WHERE id = ?').get(voteId)) throw new Error(`missing vote ${voteId}`)

const ids = segments.map((_, i) => `${fallbackIdPrefix}-${String(i + 1).padStart(3, '0')}`)
const stale = (db.prepare(`SELECT id FROM speeches WHERE id LIKE '${fallbackIdPrefix}-%'`).all() as Array<{ id: string }>).filter((row) => !ids.includes(row.id))
const deleteTranslation = db.prepare('DELETE FROM speech_translations WHERE speech_id = ?')
const deleteSpeechLink = db.prepare('DELETE FROM speech_vote_links WHERE speech_id = ?')
const deleteGroupSpeech = db.prepare('DELETE FROM speech_debate_group_speeches WHERE speech_id = ?')
const deleteSpeech = db.prepare('DELETE FROM speeches WHERE id = ?')
const upsertSpeech = db.prepare(`
  INSERT INTO speeches (
    id, session_id, agenda_item, vote_id, speaker_member_id, speaker_name, speaker_role, party,
    date, position, text_excerpt, text_full, word_count, source_url
  )
  VALUES (
    @id, @sessionId, @agendaItem, @voteId, @speakerMemberId, @speakerName, @speakerRole, @party,
    @date, @position, @textExcerpt, @textFull, @wordCount, @sourceUrl
  )
  ON CONFLICT(id) DO UPDATE SET
    session_id = excluded.session_id,
    agenda_item = excluded.agenda_item,
    vote_id = excluded.vote_id,
    speaker_member_id = excluded.speaker_member_id,
    speaker_name = excluded.speaker_name,
    speaker_role = excluded.speaker_role,
    party = excluded.party,
    date = excluded.date,
    position = excluded.position,
    text_excerpt = excluded.text_excerpt,
    text_full = excluded.text_full,
    word_count = excluded.word_count,
    source_url = excluded.source_url
`)
const upsertAgenda = db.prepare(`
  INSERT INTO plenary_agenda_items (session_id, date, agenda_item, source_title, title, source_url, review_status)
  VALUES (?, ?, ?, ?, ?, ?, 'unreviewed')
  ON CONFLICT(session_id, agenda_item) DO UPDATE SET
    date = excluded.date,
    source_title = excluded.source_title,
    title = excluded.title,
    source_url = excluded.source_url
`)
const updateVote = db.prepare('UPDATE votes SET agenda_item = ? WHERE id = ?')

const changes = db.transaction(() => {
  for (const row of stale) {
    deleteTranslation.run(row.id)
    deleteSpeechLink.run(row.id)
    deleteGroupSpeech.run(row.id)
    deleteSpeech.run(row.id)
  }
  let speechChanges = 0
  for (const [index, segment] of segments.entries()) {
    speechChanges += upsertSpeech.run({
      id: ids[index],
      sessionId,
      agendaItem,
      voteId,
      speakerMemberId: segment.speakerMemberId,
      speakerName: segment.speakerName,
      speakerRole: segment.speakerRole,
      party: segment.party,
      date,
      position: 810000 + index + 1,
      textExcerpt: segment.text.slice(0, 280),
      textFull: segment.text,
      wordCount: countWords(segment.text),
      sourceUrl,
    }).changes
  }
  const agendaChanges = upsertAgenda.run(sessionId, date, agendaItem, title, title, sourceUrl).changes
  const voteChanges = updateVote.run(agendaItem, voteId).changes
  return { speechChanges, agendaChanges, voteChanges }
})()

console.log(`session 81 PDF fallback speeches: ${segments.length} (db changes: ${changes.speechChanges}, stale removed: ${stale.length})`)
console.log(`agenda rows changed: ${changes.agendaChanges}, vote agenda updates: ${changes.voteChanges}`)

db.close()

async function loadPdf() {
  if (force || !existsSync(pdfPath)) {
    const res = await fetch(sourceUrl)
    if (!res.ok) throw new Error(`unexpected ${res.status} for ${sourceUrl}`)
    const bytes = new Uint8Array(await res.arrayBuffer())
    if (Buffer.from(bytes.slice(0, 4)).toString('utf8') !== '%PDF') throw new Error(`unexpected PDF body for ${sourceUrl}`)
    writeFileSync(pdfPath, bytes)
  }
  return new Uint8Array(readFileSync(pdfPath))
}

async function extractText(pdf: Uint8Array) {
  const doc = await getDocument({ data: pdf, verbosity: 0 }).promise
  const pages: string[] = []
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p)
    const content = await page.getTextContent()
    pages.push(cleanPage(content.items.map((item) => ('str' in item ? item.str : '')).join(' ')))
  }
  return pages.join(' ').replace(/\s+/g, ' ')
}

function extractSegments(text: string) {
  const start = text.indexOf(opening)
  const end = text.indexOf(closing, start)
  if (start < 0 || end < 0) throw new Error('pharmacy debate markers not found in session 81 PDF')
  const debate = text.slice(start, end)
  const byMarker = new Map(markers.map((marker) => [marker.marker, marker]))
  const re = new RegExp(markers.map((marker) => escapeRegExp(marker.marker)).join('|'), 'g')
  const matches = [...debate.matchAll(re)]
  const segments: Segment[] = []
  for (const [index, match] of matches.entries()) {
    const marker = byMarker.get(match[0])!
    const next = index + 1 < matches.length ? matches[index + 1].index! : debate.length
    const text = cleanSpeech(debate.slice(match.index! + marker.marker.length, next))
    const previous = segments[segments.length - 1]
    if (marker.party && text && previous?.speakerMemberId === marker.speakerMemberId) previous.text = `${previous.text}\n\n${text}`
    else if (marker.party && text) segments.push({ ...marker, text })
  }
  if (segments.length < 9) throw new Error(`too few pharmacy debate segments: ${segments.length}`)
  return segments
}

function cleanPage(text: string) {
  return text
    .replace(/Deutscher Bundestag\s*[\u2013-]\s*21\.\s*Wahlperiode\s*[\u2013-]\s*81\.\s*Sitzung\.\s*Berlin,\s*Freitag,\s*den\s*22\.\s*Mai\s*2026\s*\d+\s*\(A\)\s*\(B\)\s*\(C\)\s*\(D\)\s*[\p{L}\s.-]+$/u, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function cleanSpeech(text: string) {
  return text
    .replace(/\u00ad/g, '')
    .replace(/\b1\)\s*Ergebnis Seite \d+ [A-D]\b/g, '')
    .replace(/([A-Za-zÄÖÜäöüß])- +([a-zäöüß])/g, '$1$2')
    .replace(/\s+/g, ' ')
    .trim()
}

function countWords(text: string) {
  return text.split(/\s+/).filter(Boolean).length
}

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
