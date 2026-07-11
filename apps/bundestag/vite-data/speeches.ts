import type Database from 'better-sqlite3'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { resolvePictureUrl } from '../src/server/photoManifest'
import { speechTranslation, voteTranslation, type StaticLocale, type StaticTranslations } from './translations'

type SpeechRow = {
  id: string
  speaker_name: string
  speaker_member_id: string | null
  speaker_role: string | null
  party: string | null
  position: number
  text_full: string
  date: string
  agenda_item: string | null
  agenda_title: string | null
  debate_group_id: string | null
  contribution_type: string | null
  vote_id: string | null
  vote_clean_title: string | null
  ballot_choice: string | null
}

type MetaEntry = {
  id: string
  ids: string[]
  speakerName: string
  speakerMemberId: string | null
  speakerRole: string | null
  party: string | null
  position: number
  excerpt: string
  date: string
  agendaItem: string | null
  agendaTitle: string | null
  debateGroupId: string | null
  contributionType: string | null
  voteId: string | null
  voteTitle: string | null
  voteTitleEn: string | null
  choice: string | null
}

const PRESIDIUM_ROLE = /^(alters|vize)?präsident/i
const SHARD_COUNT = 4

function speechShard(id: string) {
  let hash = 0
  for (let index = 0; index < id.length; index++) hash = (hash * 31 + id.charCodeAt(index)) | 0
  return Math.abs(hash) % SHARD_COUNT
}

function excerpt(text: string) {
  return text.length > 160 ? `${text.slice(0, 160).replace(/\s+\S*$/, '')}…` : text
}

function buildMeta(rows: SpeechRow[], locale: StaticLocale, translations: StaticTranslations) {
  const meta: MetaEntry[] = []
  for (const row of rows) {
    if (row.speaker_role && PRESIDIUM_ROLE.test(row.speaker_role)) continue
    const previous = meta[meta.length - 1]
    if (
      previous
      && previous.date === row.date
      && previous.speakerName === row.speaker_name
      && (previous.debateGroupId ?? `a:${previous.agendaItem}`) === (row.debate_group_id ?? `a:${row.agenda_item}`)
    ) {
      previous.ids.push(row.id)
      continue
    }
    const localizedVote = row.vote_id ? voteTranslation(translations, locale, row.vote_id) : undefined
    const englishVote = row.vote_id ? translations.votes.get(row.vote_id) : undefined
    meta.push({
      id: row.id,
      ids: [row.id],
      speakerName: row.speaker_name,
      speakerMemberId: row.speaker_member_id,
      speakerRole: row.speaker_role,
      party: row.party,
      position: row.position,
      excerpt: excerpt(speechTranslation(translations, locale, row.id)?.text_full ?? row.text_full),
      date: row.date,
      agendaItem: row.agenda_item,
      agendaTitle: row.agenda_title,
      debateGroupId: row.debate_group_id,
      contributionType: row.contribution_type,
      voteId: row.vote_id,
      voteTitle: localizedVote?.clean_title ?? localizedVote?.title ?? row.vote_clean_title,
      voteTitleEn: englishVote?.clean_title ?? englishVote?.title ?? null,
      choice: row.ballot_choice === 'ja' || row.ballot_choice === 'nein' || row.ballot_choice === 'enthalten'
        ? row.ballot_choice
        : null,
    })
  }
  return meta
}

export function writeSpeechesStatic(
  db: Database.Database,
  publicDir: string,
  translations: StaticTranslations,
) {
  const rows = db.prepare(`
    WITH linked_votes AS (
      SELECT speech_id, vote_id, row_number() OVER (
        PARTITION BY speech_id
        ORDER BY confidence DESC, CASE source WHEN 'direct' THEN 0 ELSE 1 END, vote_id
      ) AS rn
      FROM speech_vote_links
    )
    SELECT s.id, s.speaker_name, s.speaker_member_id, s.speaker_role, s.party,
           COALESCE(sdgs.position, s.position) AS position,
           s.text_full, s.date, s.agenda_item,
           COALESCE(sdg.title, pai.title) AS agenda_title,
           sdgs.group_id AS debate_group_id,
           sdgs.contribution_type AS contribution_type,
           v.id AS vote_id,
           v.clean_title AS vote_clean_title,
           vm.choice AS ballot_choice
    FROM speeches s
    LEFT JOIN linked_votes lv ON lv.speech_id = s.id AND lv.rn = 1
    LEFT JOIN votes v ON v.id = lv.vote_id AND v.term_id = 21 AND v.procedural = 0 AND v.vote_type != 'hammelsprung'
    LEFT JOIN vote_members vm ON vm.vote_id = v.id AND vm.member_id = s.speaker_member_id
    LEFT JOIN speech_debate_group_speeches sdgs ON sdgs.speech_id = s.id
    LEFT JOIN speech_debate_groups sdg ON sdg.id = sdgs.group_id
    LEFT JOIN plenary_agenda_items pai ON pai.session_id = s.session_id AND pai.date = s.date AND pai.agenda_item = s.agenda_item
    ORDER BY s.date DESC, COALESCE(sdgs.position, s.position) ASC
  `).all() as SpeechRow[]
  const pictures = new Map(
    (db.prepare('SELECT id, picture_url FROM members WHERE picture_url IS NOT NULL').all() as Array<{ id: string; picture_url: string }>)
      .map((member) => [member.id, member.picture_url]),
  )
  const germanMeta = buildMeta(rows, 'de', translations)
  const englishMeta = buildMeta(rows, 'en', translations)
  const people: Record<string, string> = {}
  for (const speech of germanMeta) {
    if (!speech.speakerMemberId || people[speech.speakerMemberId]) continue
    const picture = pictures.get(speech.speakerMemberId)
    if (picture) people[speech.speakerMemberId] = resolvePictureUrl(speech.speakerMemberId, picture)
  }
  rmSync(`${publicDir}/speeches`, { force: true, recursive: true })
  rmSync(`${publicDir}/speeches-index.json`, { force: true })
  rmSync(`${publicDir}/speeches-search.json`, { force: true })
  rmSync(`${publicDir}/en/speeches`, { force: true, recursive: true })
  rmSync(`${publicDir}/en/speeches-index.json`, { force: true })
  rmSync(`${publicDir}/en/speeches-search.json`, { force: true })
  mkdirSync(`${publicDir}/en`, { recursive: true })
  writeFileSync(`${publicDir}/speeches-meta.json`, JSON.stringify(germanMeta))
  writeFileSync(`${publicDir}/speeches-people.json`, JSON.stringify(people))
  writeFileSync(`${publicDir}/en/speeches-meta.json`, JSON.stringify(englishMeta))
  writeFileSync(`${publicDir}/en/speeches-people.json`, JSON.stringify(people))
  const germanShards: Array<Record<string, string>> = Array.from({ length: SHARD_COUNT }, () => ({}))
  const englishShards: Array<Record<string, string>> = Array.from({ length: SHARD_COUNT }, () => ({}))
  for (const row of rows) {
    germanShards[speechShard(row.id)][row.id] = row.text_full
    englishShards[speechShard(row.id)][row.id] = translations.speeches.get(row.id)?.text_full ?? row.text_full
  }
  for (let index = 0; index < SHARD_COUNT; index++) {
    writeFileSync(`${publicDir}/speeches-search-${index}.json`, JSON.stringify(germanShards[index]))
    writeFileSync(`${publicDir}/speeches-search-en-${index}.json`, JSON.stringify(englishShards[index]))
    writeFileSync(`${publicDir}/en/speeches-search-${index}.json`, JSON.stringify(englishShards[index]))
  }
}
