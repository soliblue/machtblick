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

const SITE_URL = 'https://machtblick.de'

const PARTY_NORMALIZE: Record<string, string> = {
  'BÜNDNIS 90/DIE GRÜNEN': 'B90/Grüne',
  'DIE LINKE': 'Die Linke',
}

function normalizeParty(raw: string | null): string | null {
  return raw ? (PARTY_NORMALIZE[raw] ?? raw) : null
}

type SpeechRow = {
  id: string
  speaker_name: string
  speaker_member_id: string | null
  speaker_role: string | null
  party: string | null
  position: number
  text_excerpt: string
  text_full: string
  date: string
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
    SELECT s.id, s.speaker_name, s.speaker_member_id, s.speaker_role, s.party, s.position,
           s.text_excerpt, s.text_full, s.date, s.vote_id, v.title AS vote_title
    FROM speeches s
    LEFT JOIN votes v ON v.id = s.vote_id
    ORDER BY s.date DESC, s.position ASC
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
    party: normalizeParty(r.party),
    position: r.position,
    excerpt: r.text_full.slice(0, 160),
    date: r.date,
    voteId: r.vote_id,
    voteTitle: r.vote_title,
  }))
  rmSync(`${publicDir}/speeches-search.json`, { force: true })
  const SHARD_COUNT = 4
  const shards: Array<Record<string, string>> = Array.from({ length: SHARD_COUNT }, () => ({}))
  for (const r of rows) {
    if (r.speaker_role && CHAIR_ROLES.has(r.speaker_role)) continue
    let h = 0
    for (let i = 0; i < r.id.length; i++) h = (h * 31 + r.id.charCodeAt(i)) | 0
    shards[Math.abs(h) % SHARD_COUNT][r.id] = r.text_full
  }
  writeFileSync(`${publicDir}/speeches-meta.json`, JSON.stringify(meta))
  for (let i = 0; i < SHARD_COUNT; i++) {
    writeFileSync(`${publicDir}/speeches-search-${i}.json`, JSON.stringify(shards[i]))
  }
}

function prerenderPaths(): string[] {
  const db = new Database(fileURLToPath(new URL('../../db/machtblick.sqlite', import.meta.url)), { readonly: true })
  const paths = ['/', '/votes/', '/members/', '/parties/', '/reden/']
  const votes = db.prepare("SELECT id FROM votes WHERE procedural = 0 AND vote_type != 'hammelsprung'").all() as Array<{ id: string }>
  for (const v of votes) paths.push(`/votes/${v.id}/`)
  const members = db.prepare('SELECT id FROM members').all() as Array<{ id: string }>
  for (const m of members) {
    paths.push(`/members/${m.id}/`)
    paths.push(`/members/${m.id}/abstimmungen/`)
    paths.push(`/members/${m.id}/reden/`)
    paths.push(`/members/${m.id}/anfragen/`)
  }
  const parties = db.prepare(`
    SELECT DISTINCT s.party FROM vote_party_summaries s
    INNER JOIN votes v ON v.id = s.vote_id
    WHERE v.vote_type = 'namentlich'
  `).all() as Array<{ party: string }>
  const slugMap: Record<string, string> = { 'CDU/CSU': 'cdu-csu', SPD: 'spd', AfD: 'afd', 'B90/Grüne': 'gruene', 'Die Linke': 'linke', fraktionslos: 'fraktionslos' }
  for (const p of parties) {
    const slug = slugMap[p.party]
    if (!slug) continue
    paths.push(`/parties/${slug}/`)
    paths.push(`/members/?party=${encodeURIComponent(p.party)}`)
  }
  db.close()
  return paths
}

function writeSitemap(paths: string[]) {
  const seen = new Set<string>()
  const urls = paths
    .filter((p) => !p.includes('?'))
    .map((p) => p.replace(/\/$/, '') || '/')
    .filter((p) => (seen.has(p) ? false : (seen.add(p), true)))
  const today = new Date().toISOString().slice(0, 10)
  const body = urls
    .map((p) => `  <url><loc>${SITE_URL}${p}</loc><lastmod>${today}</lastmod></url>`)
    .join('\n')
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
  writeFileSync(fileURLToPath(new URL('./public/sitemap.xml', import.meta.url)), xml)
}

function writeJsonEndpoints() {
  const db = new Database(fileURLToPath(new URL('../../db/machtblick.sqlite', import.meta.url)), { readonly: true })
  const publicDir = fileURLToPath(new URL('./public', import.meta.url))
  mkdirSync(`${publicDir}/api`, { recursive: true })
  writeFileSync(`${publicDir}/api/votes.json`, JSON.stringify(leanVotes(db)))
  writeFileSync(`${publicDir}/api/members.json`, JSON.stringify(leanMembers(db)))
  writeFileSync(`${publicDir}/api/parties.json`, JSON.stringify(leanParties(db)))
  const voteIds = db.prepare("SELECT id FROM votes WHERE procedural = 0 AND vote_type != 'hammelsprung'").all() as Array<{ id: string }>
  mkdirSync(`${publicDir}/votes`, { recursive: true })
  for (const { id } of voteIds) writeFileSync(`${publicDir}/votes/${id}.json`, JSON.stringify(fullVote(db, id)))
  const memberIds = db.prepare('SELECT id FROM members').all() as Array<{ id: string }>
  mkdirSync(`${publicDir}/members`, { recursive: true })
  for (const { id } of memberIds) writeFileSync(`${publicDir}/members/${id}.json`, JSON.stringify(fullMember(db, id)))
  const slugMap: Record<string, string> = { 'CDU/CSU': 'cdu-csu', SPD: 'spd', AfD: 'afd', 'B90/Grüne': 'gruene', 'Die Linke': 'linke', fraktionslos: 'fraktionslos' }
  const parties = db.prepare(`
    SELECT DISTINCT s.party FROM vote_party_summaries s
    INNER JOIN votes v ON v.id = s.vote_id WHERE v.vote_type = 'namentlich'
  `).all() as Array<{ party: string }>
  mkdirSync(`${publicDir}/parties`, { recursive: true })
  for (const { party } of parties) {
    const slug = slugMap[party]
    if (slug) writeFileSync(`${publicDir}/parties/${slug}.json`, JSON.stringify(fullParty(db, slug)))
  }
  db.close()
}

const prerenderedPaths = prerenderPaths()
writeSitemap(prerenderedPaths)
writeSpeechesStatic()
writeJsonEndpoints()

export default defineConfig({
  server: { port: 3000, host: true },
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
