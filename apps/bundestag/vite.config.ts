import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { writeFileSync, mkdirSync, rmSync } from 'node:fs'
import Database from 'better-sqlite3'

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
  const speechesDir = `${publicDir}/speeches`
  rmSync(speechesDir, { recursive: true, force: true })
  mkdirSync(speechesDir, { recursive: true })
  const index = rows.map((r) => ({
    id: r.id,
    speakerName: r.speaker_name,
    speakerMemberId: r.speaker_member_id,
    speakerRole: r.speaker_role,
    party: normalizeParty(r.party),
    position: r.position,
    excerpt: r.text_excerpt,
    text: r.text_full,
    date: r.date,
    voteId: r.vote_id,
    voteTitle: r.vote_title,
  }))
  writeFileSync(`${publicDir}/speeches-index.json`, JSON.stringify(index))
  for (const r of rows) {
    writeFileSync(`${speechesDir}/${r.id}.json`, JSON.stringify({ text: r.text_full, date: r.date }))
  }
}

function prerenderPaths(): string[] {
  const db = new Database(fileURLToPath(new URL('../../db/machtblick.sqlite', import.meta.url)), { readonly: true })
  const paths = ['/', '/votes/', '/members/', '/parties/', '/reden/']
  const votes = db.prepare('SELECT id FROM votes WHERE procedural = 0').all() as Array<{ id: string }>
  for (const v of votes) paths.push(`/votes/${v.id}/`)
  const members = db.prepare('SELECT id FROM members').all() as Array<{ id: string }>
  for (const m of members) paths.push(`/members/${m.id}/`)
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

const prerenderedPaths = prerenderPaths()
writeSitemap(prerenderedPaths)
writeSpeechesStatic()

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
