import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { writeFileSync, mkdirSync, rmSync } from 'node:fs'
import Database from 'better-sqlite3'
import { leanVotes, fullVote } from './vite-data/votes'
import { leanMembers, fullMember } from './vite-data/members'
import { leanParties, fullParty } from './vite-data/parties'
import { fullAntrag } from './vite-data/antraege'

const SITE_URL = 'https://machtblick.de'
const CURRENT_TERM = 21

type SpeechRow = {
  id: string
  speaker_name: string
  speaker_member_id: string | null
  speaker_role: string | null
  party: string | null
  position: number
  text_excerpt: string
  text_full: string
  text_excerpt_en: string | null
  text_full_en: string | null
  date: string
  agenda_item: string | null
  agenda_title: string | null
  debate_group_id: string | null
  contribution_type: string | null
  vote_id: string | null
  vote_title: string | null
}

const CHAIR_ROLES = new Set([
  'Präsident',
  'Präsidentin',
  'Vizepräsident',
  'Vizepräsidentin',
  'Alterspräsident',
  'Alterspräsidentin',
])

function writeSpeechesStatic() {
  const db = new Database(fileURLToPath(new URL('../../db/machtblick.sqlite', import.meta.url)), { readonly: true })
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
           s.text_excerpt, s.text_full, st.text_excerpt AS text_excerpt_en, st.text_full AS text_full_en,
           s.date, s.agenda_item,
           COALESCE(sdg.title, pai.title) AS agenda_title,
           sdgs.group_id AS debate_group_id,
           sdgs.contribution_type AS contribution_type,
           lv.vote_id AS vote_id,
           COALESCE(v.clean_title, v.title) AS vote_title
    FROM speeches s
    LEFT JOIN linked_votes lv ON lv.speech_id = s.id AND lv.rn = 1
    LEFT JOIN votes v ON v.id = lv.vote_id
    LEFT JOIN speech_debate_group_speeches sdgs ON sdgs.speech_id = s.id
    LEFT JOIN speech_debate_groups sdg ON sdg.id = sdgs.group_id
    LEFT JOIN plenary_agenda_items pai ON pai.session_id = s.session_id AND pai.date = s.date AND pai.agenda_item = s.agenda_item
    LEFT JOIN speech_translations st ON st.speech_id = s.id AND st.locale = 'en'
    ORDER BY s.date DESC, COALESCE(sdgs.position, s.position) ASC
  `).all() as SpeechRow[]
  db.close()
  const publicDir = fileURLToPath(new URL('./public', import.meta.url))
  rmSync(`${publicDir}/speeches`, { force: true, recursive: true })
  rmSync(`${publicDir}/speeches-index.json`, { force: true })
  const meta = rows.map((r) => ({
    id: r.id,
    speakerName: r.speaker_name,
    speakerMemberId: r.speaker_member_id,
    speakerRole: r.speaker_role,
    party: r.party,
    position: r.position,
    excerpt: r.text_full.slice(0, 160),
    date: r.date,
    agendaItem: r.agenda_item,
    agendaTitle: r.agenda_title,
    debateGroupId: r.debate_group_id,
    contributionType: r.contribution_type,
    voteId: r.vote_id,
    voteTitle: r.vote_title,
  }))
  rmSync(`${publicDir}/speeches-search.json`, { force: true })
  const SHARD_COUNT = 4
  const shards: Array<Record<string, string>> = Array.from({ length: SHARD_COUNT }, () => ({}))
  const englishShards: Array<Record<string, string>> = Array.from({ length: SHARD_COUNT }, () => ({}))
  for (const r of rows) {
    if (r.speaker_role && CHAIR_ROLES.has(r.speaker_role)) continue
    let h = 0
    for (let i = 0; i < r.id.length; i++) h = (h * 31 + r.id.charCodeAt(i)) | 0
    const shard = Math.abs(h) % SHARD_COUNT
    shards[shard][r.id] = r.text_full
    if (r.text_full_en) englishShards[shard][r.id] = r.text_full_en
  }
  writeFileSync(`${publicDir}/speeches-meta.json`, JSON.stringify(meta))
  for (let i = 0; i < SHARD_COUNT; i++) {
    writeFileSync(`${publicDir}/speeches-search-${i}.json`, JSON.stringify(shards[i]))
    writeFileSync(`${publicDir}/speeches-search-en-${i}.json`, JSON.stringify(englishShards[i]))
  }
}

function prerenderPaths(): string[] {
  const db = new Database(fileURLToPath(new URL('../../db/machtblick.sqlite', import.meta.url)), { readonly: true })
  const paths = ['/', '/votes/', '/members/', '/parties/', '/speeches/', '/imprint/', '/privacy/', '/en/', '/en/votes/', '/en/members/', '/en/parties/', '/en/speeches/', '/en/imprint/', '/en/privacy/']
  const votes = db.prepare("SELECT id FROM votes WHERE term_id = ? AND procedural = 0 AND vote_type != 'hammelsprung'").all(CURRENT_TERM) as Array<{ id: string }>
  for (const v of votes) {
    paths.push(`/votes/${v.id}/`)
    paths.push(`/en/votes/${v.id}/`)
  }
  for (const a of publishableAntragIds(db)) {
    paths.push(`/motions/${a.id}/`)
  }
  for (const a of publishableAntragIds(db, 'en')) {
    paths.push(`/en/motions/${a.id}/`)
  }
  const members = db.prepare(`
    SELECT DISTINCT m.rowid, m.id
    FROM members m
    INNER JOIN vote_members vm ON vm.member_id = m.id
    INNER JOIN votes v ON v.id = vm.vote_id
    WHERE v.term_id = ?
    ORDER BY m.rowid
  `).all(CURRENT_TERM) as Array<{ id: string }>
  for (const m of members) {
    paths.push(`/members/${m.id}/`)
    paths.push(`/members/${m.id}/votes/`)
    paths.push(`/members/${m.id}/speeches/`)
    paths.push(`/members/${m.id}/motions/`)
    paths.push(`/en/members/${m.id}/`)
    paths.push(`/en/members/${m.id}/votes/`)
    paths.push(`/en/members/${m.id}/speeches/`)
    paths.push(`/en/members/${m.id}/motions/`)
  }
  const parties = db.prepare(`
    SELECT DISTINCT s.party FROM vote_party_summaries s
    INNER JOIN votes v ON v.id = s.vote_id
    WHERE v.term_id = ? AND v.vote_type = 'namentlich'
  `).all(CURRENT_TERM) as Array<{ party: string }>
  const slugMap: Record<string, string> = { 'CDU/CSU': 'cdu-csu', SPD: 'spd', AfD: 'afd', 'B90/Grüne': 'gruene', 'Die Linke': 'linke', fraktionslos: 'fraktionslos' }
  for (const p of parties) {
    const slug = slugMap[p.party]
    if (!slug) continue
    paths.push(`/parties/${slug}/`)
    paths.push(`/parties/${slug}/profile/`)
    paths.push(`/parties/${slug}/votes/`)
    paths.push(`/parties/${slug}/history/`)
    paths.push(`/en/parties/${slug}/`)
    paths.push(`/en/parties/${slug}/profile/`)
    paths.push(`/en/parties/${slug}/votes/`)
    paths.push(`/en/parties/${slug}/history/`)
  }
  db.close()
  return paths
}

function publishableAntragIds(db: Database.Database, locale: 'de' | 'en' = 'de') {
  const sql = locale === 'en'
    ? `
      SELECT a.id
      FROM antraege a
      INNER JOIN antrag_descriptions ad ON ad.antrag_id = a.id
      INNER JOIN antrag_description_translations t ON t.antrag_id = a.id AND t.locale = 'en'
      WHERE a.wahlperiode = ?
      ORDER BY a.id
    `
    : `
      SELECT a.id
      FROM antraege a
      INNER JOIN antrag_descriptions ad ON ad.antrag_id = a.id
      WHERE a.wahlperiode = ?
      ORDER BY a.id
    `
  return db.prepare(sql).all(CURRENT_TERM) as Array<{ id: number }>
}

function writeSitemap(paths: string[]) {
  const seen = new Set<string>()
  const urls = paths
    .filter((p) => !p.includes('?'))
    .map((p) => (p === '/' || p.endsWith('/') ? p : `${p}/`))
    .filter((p) => (seen.has(p) ? false : (seen.add(p), true)))
  const body = urls
    .map((p) => `  <url><loc>${SITE_URL}${p}</loc></url>`)
    .join('\n')
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
  writeFileSync(fileURLToPath(new URL('./public/sitemap.xml', import.meta.url)), xml)
}

function sitemapPaths(): string[] {
  const db = new Database(fileURLToPath(new URL('../../db/machtblick.sqlite', import.meta.url)), { readonly: true })
  const paths = ['/votes/', '/members/', '/parties/', '/speeches/', '/imprint/', '/privacy/', '/en/votes/', '/en/members/', '/en/parties/', '/en/speeches/', '/en/imprint/', '/en/privacy/']
  const votes = db.prepare("SELECT id FROM votes WHERE term_id = ? AND procedural = 0 AND vote_type != 'hammelsprung'").all(CURRENT_TERM) as Array<{ id: string }>
  for (const v of votes) {
    paths.push(`/votes/${v.id}/`)
    paths.push(`/en/votes/${v.id}/`)
  }
  for (const a of publishableAntragIds(db)) paths.push(`/motions/${a.id}/`)
  for (const a of publishableAntragIds(db, 'en')) paths.push(`/en/motions/${a.id}/`)
  const members = db.prepare(`
    SELECT DISTINCT m.rowid, m.id
    FROM members m
    INNER JOIN vote_members vm ON vm.member_id = m.id
    INNER JOIN votes v ON v.id = vm.vote_id
    WHERE v.term_id = ?
    ORDER BY m.rowid
  `).all(CURRENT_TERM) as Array<{ id: string }>
  for (const m of members) {
    paths.push(`/members/${m.id}/votes/`)
    paths.push(`/en/members/${m.id}/votes/`)
  }
  const parties = db.prepare(`
    SELECT DISTINCT s.party FROM vote_party_summaries s
    INNER JOIN votes v ON v.id = s.vote_id
    WHERE v.term_id = ? AND v.vote_type = 'namentlich'
  `).all(CURRENT_TERM) as Array<{ party: string }>
  const slugMap: Record<string, string> = { 'CDU/CSU': 'cdu-csu', SPD: 'spd', AfD: 'afd', 'B90/Grüne': 'gruene', 'Die Linke': 'linke', fraktionslos: 'fraktionslos' }
  for (const p of parties) {
    const slug = slugMap[p.party]
    if (slug) {
      paths.push(`/parties/${slug}/profile/`)
      paths.push(`/en/parties/${slug}/profile/`)
    }
  }
  db.close()
  return paths
}

function writeJsonEndpoints() {
  const db = new Database(fileURLToPath(new URL('../../db/machtblick.sqlite', import.meta.url)), { readonly: true })
  const publicDir = fileURLToPath(new URL('./public', import.meta.url))
  mkdirSync(`${publicDir}/api`, { recursive: true })
  writeFileSync(`${publicDir}/api/votes.json`, JSON.stringify(leanVotes(db)))
  writeFileSync(`${publicDir}/api/members.json`, JSON.stringify(leanMembers(db)))
  writeFileSync(`${publicDir}/api/parties.json`, JSON.stringify(leanParties(db)))
  const voteIds = db.prepare("SELECT id FROM votes WHERE term_id = ? AND procedural = 0 AND vote_type != 'hammelsprung'").all(CURRENT_TERM) as Array<{ id: string }>
  mkdirSync(`${publicDir}/votes`, { recursive: true })
  for (const { id } of voteIds) writeFileSync(`${publicDir}/votes/${id}.json`, JSON.stringify(fullVote(db, id)))
  const antragIds = publishableAntragIds(db)
  const englishAntragIds = publishableAntragIds(db, 'en')
  rmSync(`${publicDir}/antraege`, { force: true, recursive: true })
  rmSync(`${publicDir}/en/antraege`, { force: true, recursive: true })
  rmSync(`${publicDir}/motions`, { force: true, recursive: true })
  rmSync(`${publicDir}/en/motions`, { force: true, recursive: true })
  mkdirSync(`${publicDir}/motions`, { recursive: true })
  mkdirSync(`${publicDir}/en/motions`, { recursive: true })
  for (const { id } of antragIds) {
    writeFileSync(`${publicDir}/motions/${id}.json`, JSON.stringify(fullAntrag(db, id)))
  }
  for (const { id } of englishAntragIds) {
    writeFileSync(`${publicDir}/en/motions/${id}.json`, JSON.stringify(fullAntrag(db, id, 'en')))
  }
  const memberIds = db.prepare(`
    SELECT DISTINCT m.rowid, m.id
    FROM members m
    INNER JOIN vote_members vm ON vm.member_id = m.id
    INNER JOIN votes v ON v.id = vm.vote_id
    WHERE v.term_id = ?
    ORDER BY m.rowid
  `).all(CURRENT_TERM) as Array<{ id: string }>
  mkdirSync(`${publicDir}/members`, { recursive: true })
  for (const { id } of memberIds) writeFileSync(`${publicDir}/members/${id}.json`, JSON.stringify(fullMember(db, id)))
  const slugMap: Record<string, string> = { 'CDU/CSU': 'cdu-csu', SPD: 'spd', AfD: 'afd', 'B90/Grüne': 'gruene', 'Die Linke': 'linke', fraktionslos: 'fraktionslos' }
  const parties = db.prepare(`
    SELECT DISTINCT s.party FROM vote_party_summaries s
    INNER JOIN votes v ON v.id = s.vote_id WHERE v.term_id = ? AND v.vote_type = 'namentlich'
  `).all(CURRENT_TERM) as Array<{ party: string }>
  mkdirSync(`${publicDir}/parties`, { recursive: true })
  for (const { party } of parties) {
    const slug = slugMap[party]
    if (slug) writeFileSync(`${publicDir}/parties/${slug}.json`, JSON.stringify(fullParty(db, slug)))
  }
  db.close()
}

const prerenderedPaths = prerenderPaths()
writeSitemap(sitemapPaths())
writeSpeechesStatic()
writeJsonEndpoints()

export default defineConfig({
  server: { port: 3000, host: true, allowedHosts: ['dev.machtblick.de'] },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  plugins: [
    tailwindcss(),
    tanstackStart({
      pages: prerenderedPaths.map((path) => ({ path })),
      prerender: { enabled: true, crawlLinks: false },
      spa: { enabled: false },
    }),
    viteReact(),
  ],
})
