import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { writeFileSync, mkdirSync, rmSync } from 'node:fs'
import Database from 'better-sqlite3'
import { leanVotes, fullVote, loadVoteBuildData } from './vite-data/votes'
import { leanMembers, fullMember, loadMemberBuildData } from './vite-data/members'
import { leanParties, fullParty } from './vite-data/parties'
import { fullAntrag, leanMotions } from './vite-data/antraege'
import { plainDescription } from './src/lib/seo'
import { loadStaticTranslations, type StaticLocale } from './vite-data/translations'
import { writeSpeechesStatic } from './vite-data/speeches'

const SITE_URL = 'https://machtblick.de'
const CURRENT_TERM = 21

function prerenderPaths(): string[] {
  const db = new Database(fileURLToPath(new URL('../../db/machtblick.sqlite', import.meta.url)), { readonly: true })
  const paths = ['/', '/votes/', '/motions/', '/members/', '/parties/', '/speeches/', '/imprint/', '/privacy/', '/methodology/', '/en/', '/en/votes/', '/en/motions/', '/en/members/', '/en/parties/', '/en/speeches/', '/en/imprint/', '/en/privacy/', '/en/methodology/']
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
    paths.push(`/en/members/${m.id}/`)
    paths.push(`/en/members/${m.id}/votes/`)
    paths.push(`/en/members/${m.id}/speeches/`)
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

type SitemapEntry = { path: string; lastmod?: string }

function writeSitemap(entries: SitemapEntry[]) {
  const seen = new Set<string>()
  const urls = entries
    .filter((e) => !e.path.includes('?'))
    .map((e) => ({ ...e, path: e.path === '/' || e.path.endsWith('/') ? e.path : `${e.path}/` }))
    .filter((e) => (seen.has(e.path) ? false : (seen.add(e.path), true)))
  const body = urls
    .map((e) => `  <url><loc>${SITE_URL}${e.path}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ''}</url>`)
    .join('\n')
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
  writeFileSync(fileURLToPath(new URL('./public/sitemap.xml', import.meta.url)), xml)
}

function sitemapEntries(): SitemapEntry[] {
  const db = new Database(fileURLToPath(new URL('../../db/machtblick.sqlite', import.meta.url)), { readonly: true })
  const latest = (db.prepare('SELECT max(date) AS d FROM votes WHERE term_id = ?').get(CURRENT_TERM) as { d: string | null }).d ?? undefined
  const entries: SitemapEntry[] = [
    ...['/votes/', '/members/', '/parties/', '/speeches/', '/en/votes/', '/en/members/', '/en/parties/', '/en/speeches/'].map((path) => ({ path, lastmod: latest })),
    { path: '/imprint/' },
    { path: '/privacy/' },
    { path: '/methodology/' },
    { path: '/en/imprint/' },
    { path: '/en/privacy/' },
    { path: '/en/methodology/' },
  ]
  const votes = db.prepare("SELECT id, date FROM votes WHERE term_id = ? AND procedural = 0 AND vote_type != 'hammelsprung'").all(CURRENT_TERM) as Array<{ id: string; date: string }>
  for (const v of votes) {
    entries.push({ path: `/votes/${v.id}/`, lastmod: v.date })
    entries.push({ path: `/en/votes/${v.id}/`, lastmod: v.date })
  }
  const antragDates = new Map(
    (db.prepare(`
      SELECT a.id, max(
        coalesce(a.introduced_date, ''),
        coalesce((SELECT max(v.date) FROM vote_antraege va INNER JOIN votes v ON v.id = va.vote_id WHERE va.antrag_id = a.id), '')
      ) AS d
      FROM antraege a WHERE a.wahlperiode = ?
    `).all(CURRENT_TERM) as Array<{ id: number; d: string }>).map((r) => [r.id, r.d || undefined]),
  )
  const latestMotionActivity = [...antragDates.values()].filter((d): d is string => !!d).sort().pop()
  entries.push({ path: '/motions/', lastmod: latestMotionActivity })
  entries.push({ path: '/en/motions/', lastmod: latestMotionActivity })
  for (const a of publishableAntragIds(db)) entries.push({ path: `/motions/${a.id}/`, lastmod: antragDates.get(a.id) })
  for (const a of publishableAntragIds(db, 'en')) entries.push({ path: `/en/motions/${a.id}/`, lastmod: antragDates.get(a.id) })
  const members = db.prepare(`
    SELECT m.rowid, m.id, max(v.date) AS d
    FROM members m
    INNER JOIN vote_members vm ON vm.member_id = m.id
    INNER JOIN votes v ON v.id = vm.vote_id
    WHERE v.term_id = ?
    GROUP BY m.rowid, m.id
    ORDER BY m.rowid
  `).all(CURRENT_TERM) as Array<{ id: string; d: string }>
  for (const m of members) {
    entries.push({ path: `/members/${m.id}/votes/`, lastmod: m.d })
    entries.push({ path: `/en/members/${m.id}/votes/`, lastmod: m.d })
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
      entries.push({ path: `/parties/${slug}/`, lastmod: latest })
      entries.push({ path: `/en/parties/${slug}/`, lastmod: latest })
    }
  }
  db.close()
  return entries
}

function writeJsonEndpoints() {
  const db = new Database(fileURLToPath(new URL('../../db/machtblick.sqlite', import.meta.url)), { readonly: true })
  const publicDir = fileURLToPath(new URL('./public', import.meta.url))
  const translations = loadStaticTranslations(db)
  const voteData = loadVoteBuildData(db, translations)
  const memberData = loadMemberBuildData(db, translations)
  const voteIds = db.prepare("SELECT id FROM votes WHERE term_id = ? AND procedural = 0 AND vote_type != 'hammelsprung'").all(CURRENT_TERM) as Array<{ id: string }>
  const memberIds = db.prepare(`
    SELECT DISTINCT m.rowid, m.id
    FROM members m
    INNER JOIN vote_members vm ON vm.member_id = m.id
    INNER JOIN votes v ON v.id = vm.vote_id
    WHERE v.term_id = ?
    ORDER BY m.rowid
  `).all(CURRENT_TERM) as Array<{ id: string }>
  const slugMap: Record<string, string> = { 'CDU/CSU': 'cdu-csu', SPD: 'spd', AfD: 'afd', 'B90/Grüne': 'gruene', 'Die Linke': 'linke', fraktionslos: 'fraktionslos' }
  const parties = db.prepare(`
    SELECT DISTINCT s.party FROM vote_party_summaries s
    INNER JOIN votes v ON v.id = s.vote_id WHERE v.term_id = ? AND v.vote_type = 'namentlich'
  `).all(CURRENT_TERM) as Array<{ party: string }>
  rmSync(`${publicDir}/antraege`, { force: true, recursive: true })
  rmSync(`${publicDir}/en/antraege`, { force: true, recursive: true })
  for (const locale of ['de', 'en'] satisfies StaticLocale[]) {
    const prefix = locale === 'en' ? '/en' : ''
    rmSync(`${publicDir}${prefix}/api`, { force: true, recursive: true })
    mkdirSync(`${publicDir}${prefix}/api`, { recursive: true })
    writeFileSync(`${publicDir}${prefix}/api/votes.json`, JSON.stringify(leanVotes(db, locale, voteData)))
    writeFileSync(`${publicDir}${prefix}/api/members.json`, JSON.stringify(leanMembers(db, memberData)))
    writeFileSync(`${publicDir}${prefix}/api/parties.json`, JSON.stringify(leanParties(db)))
    writeFileSync(`${publicDir}${prefix}/api/motions.json`, JSON.stringify(leanMotions(db, locale, translations)))
    for (const directory of ['votes', 'motions', 'members']) {
      rmSync(`${publicDir}${prefix}/${directory}`, { force: true, recursive: true })
      mkdirSync(`${publicDir}${prefix}/${directory}`, { recursive: true })
    }
    mkdirSync(`${publicDir}${prefix}/parties`, { recursive: true })
    for (const { id } of voteIds) {
      writeFileSync(`${publicDir}${prefix}/votes/${id}.json`, JSON.stringify(fullVote(db, id, locale, voteData)))
    }
    for (const { id } of publishableAntragIds(db)) {
      writeFileSync(
        `${publicDir}${prefix}/motions/${id}.json`,
        JSON.stringify(fullAntrag(db, id, locale, translations, voteData.seats)),
      )
    }
    for (const { id } of memberIds) {
      writeFileSync(`${publicDir}${prefix}/members/${id}.json`, JSON.stringify(fullMember(db, id, locale, memberData)))
    }
    for (const { party } of parties) {
      const slug = slugMap[party]
      if (slug) {
        writeFileSync(`${publicDir}${prefix}/parties/${slug}.json`, JSON.stringify(fullParty(db, slug, locale, translations)))
      }
    }
  }
  writeSpeechesStatic(db, publicDir, translations)
  db.close()
}

function writeVotesFeed() {
  const db = new Database(fileURLToPath(new URL('../../db/machtblick.sqlite', import.meta.url)), { readonly: true })
  const votes = db.prepare(`
    SELECT id, date, title, clean_title, result, coalesce(summary_simplified, summary, subject, title) AS summary
    FROM votes WHERE term_id = ? AND procedural = 0 AND is_petition_bundle = 0 AND vote_type != 'hammelsprung'
    ORDER BY date DESC, bundestag_id DESC LIMIT 50
  `).all(CURRENT_TERM) as Array<{ id: string; date: string; title: string; clean_title: string | null; result: 'angenommen' | 'abgelehnt'; summary: string }>
  db.close()
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const entries = votes.map((v) => [
    '  <entry>',
    `    <id>${SITE_URL}/votes/${v.id}/</id>`,
    `    <title>${esc(`${v.clean_title ?? v.title}: ${v.result}`)}</title>`,
    `    <link rel="alternate" type="text/html" href="${SITE_URL}/votes/${v.id}/"/>`,
    `    <published>${v.date}T00:00:00Z</published>`,
    `    <updated>${v.date}T00:00:00Z</updated>`,
    `    <summary>${esc(plainDescription(v.summary, 300))}</summary>`,
    '  </entry>',
  ].join('\n')).join('\n')
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="de">',
    `  <id>${SITE_URL}/votes/</id>`,
    '  <title>Machtblick: Abstimmungen im Bundestag</title>',
    '  <subtitle>Die neuesten Abstimmungen des Deutschen Bundestags mit Ergebnis und Zusammenfassung</subtitle>',
    `  <link rel="self" type="application/atom+xml" href="${SITE_URL}/votes.xml"/>`,
    `  <link rel="alternate" type="text/html" href="${SITE_URL}/votes/"/>`,
    `  <updated>${votes[0].date}T00:00:00Z</updated>`,
    `  <author><name>Machtblick</name><uri>${SITE_URL}</uri></author>`,
    entries,
    '</feed>',
    '',
  ].join('\n')
  writeFileSync(fileURLToPath(new URL('./public/votes.xml', import.meta.url)), xml)
}

function latestVoteDate() {
  const db = new Database(fileURLToPath(new URL('../../db/machtblick.sqlite', import.meta.url)), { readonly: true })
  const latest = (db.prepare('SELECT max(date) AS d FROM votes WHERE term_id = ?').get(CURRENT_TERM) as { d: string | null }).d
  db.close()
  return latest ?? new Date().toISOString().slice(0, 10)
}

const prerenderedPaths = prerenderPaths()
writeSitemap(sitemapEntries())
writeVotesFeed()
writeJsonEndpoints()

export default defineConfig({
  define: { __DATA_LAST_MODIFIED__: JSON.stringify(latestVoteDate()) },
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
