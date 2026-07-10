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
import { fullAntrag, leanMotions } from './vite-data/antraege'
import { resolvePictureUrl } from './src/server/photoManifest'
import { plainDescription } from './src/lib/seo'

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
  vote_title_en: string | null
  ballot_choice: string | null
}

const PRESIDIUM_ROLE = /^(alters|vize)?präsident/i

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
           v.id AS vote_id,
           v.clean_title AS vote_title,
           COALESCE(vt.clean_title, vt.title) AS vote_title_en,
           vm.choice AS ballot_choice
    FROM speeches s
    LEFT JOIN linked_votes lv ON lv.speech_id = s.id AND lv.rn = 1
    LEFT JOIN votes v ON v.id = lv.vote_id AND v.term_id = 21 AND v.procedural = 0 AND v.vote_type != 'hammelsprung'
    LEFT JOIN vote_members vm ON vm.vote_id = v.id AND vm.member_id = s.speaker_member_id
    LEFT JOIN vote_translations vt ON vt.vote_id = v.id AND vt.locale = 'en'
    LEFT JOIN speech_debate_group_speeches sdgs ON sdgs.speech_id = s.id
    LEFT JOIN speech_debate_groups sdg ON sdg.id = sdgs.group_id
    LEFT JOIN plenary_agenda_items pai ON pai.session_id = s.session_id AND pai.date = s.date AND pai.agenda_item = s.agenda_item
    LEFT JOIN speech_translations st ON st.speech_id = s.id AND st.locale = 'en'
    ORDER BY s.date DESC, COALESCE(sdgs.position, s.position) ASC
  `).all() as SpeechRow[]
  const pictures = new Map(
    (db.prepare('SELECT id, picture_url FROM members WHERE picture_url IS NOT NULL').all() as Array<{ id: string; picture_url: string }>)
      .map((m) => [m.id, m.picture_url]),
  )
  db.close()
  const publicDir = fileURLToPath(new URL('./public', import.meta.url))
  rmSync(`${publicDir}/speeches`, { force: true, recursive: true })
  rmSync(`${publicDir}/speeches-index.json`, { force: true })
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
  const debateKey = (groupId: string | null, agendaItem: string | null) => groupId ?? `a:${agendaItem}`
  const meta: MetaEntry[] = []
  for (const r of rows) {
    if (r.speaker_role && PRESIDIUM_ROLE.test(r.speaker_role)) continue
    const prev = meta[meta.length - 1]
    if (prev && prev.date === r.date && prev.speakerName === r.speaker_name && debateKey(prev.debateGroupId, prev.agendaItem) === debateKey(r.debate_group_id, r.agenda_item)) {
      prev.ids.push(r.id)
      continue
    }
    meta.push({
      id: r.id,
      ids: [r.id],
      speakerName: r.speaker_name,
      speakerMemberId: r.speaker_member_id,
      speakerRole: r.speaker_role,
      party: r.party,
      position: r.position,
      excerpt: r.text_full.length > 160 ? `${r.text_full.slice(0, 160).replace(/\s+\S*$/, '')}…` : r.text_full,
      date: r.date,
      agendaItem: r.agenda_item,
      agendaTitle: r.agenda_title,
      debateGroupId: r.debate_group_id,
      contributionType: r.contribution_type,
      voteId: r.vote_id,
      voteTitle: r.vote_title,
      voteTitleEn: r.vote_title_en,
      choice: r.ballot_choice === 'ja' || r.ballot_choice === 'nein' || r.ballot_choice === 'enthalten' ? r.ballot_choice : null,
    })
  }
  const people: Record<string, string> = {}
  for (const m of meta) {
    if (!m.speakerMemberId || people[m.speakerMemberId]) continue
    const url = pictures.get(m.speakerMemberId)
    if (url) people[m.speakerMemberId] = resolvePictureUrl(m.speakerMemberId, url)
  }
  rmSync(`${publicDir}/speeches-search.json`, { force: true })
  const SHARD_COUNT = 4
  const shards: Array<Record<string, string>> = Array.from({ length: SHARD_COUNT }, () => ({}))
  const englishShards: Array<Record<string, string>> = Array.from({ length: SHARD_COUNT }, () => ({}))
  for (const r of rows) {
    let h = 0
    for (let i = 0; i < r.id.length; i++) h = (h * 31 + r.id.charCodeAt(i)) | 0
    const shard = Math.abs(h) % SHARD_COUNT
    shards[shard][r.id] = r.text_full
    if (r.text_full_en) englishShards[shard][r.id] = r.text_full_en
  }
  writeFileSync(`${publicDir}/speeches-meta.json`, JSON.stringify(meta))
  writeFileSync(`${publicDir}/speeches-people.json`, JSON.stringify(people))
  for (let i = 0; i < SHARD_COUNT; i++) {
    writeFileSync(`${publicDir}/speeches-search-${i}.json`, JSON.stringify(shards[i]))
    writeFileSync(`${publicDir}/speeches-search-en-${i}.json`, JSON.stringify(englishShards[i]))
  }
}

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
  const parliamentSlug: Record<string, string> = { eu: 'eu', be: 'berlin', by: 'bayern' }
  for (const [dbKey, section] of Object.entries(parliamentSlug)) {
    paths.push(`/${section}/`, `/${section}/members/`, `/${section}/parties/`)
    for (const v of db.prepare('SELECT id FROM mp_votes WHERE parliament = ?').all(dbKey) as Array<{ id: string }>) {
      paths.push(`/${section}/votes/${v.id}/`)
    }
    for (const m of db.prepare('SELECT DISTINCT member_id AS id FROM mp_member_votes WHERE parliament = ?').all(dbKey) as Array<{ id: string }>) {
      paths.push(`/${section}/members/${m.id}/`)
    }
    for (const p of db.prepare('SELECT slug FROM mp_parties WHERE parliament = ?').all(dbKey) as Array<{ slug: string }>) {
      paths.push(`/${section}/parties/${p.slug}/`)
    }
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
      entries.push({ path: `/parties/${slug}/profile/`, lastmod: latest })
      entries.push({ path: `/en/parties/${slug}/profile/`, lastmod: latest })
    }
  }
  db.close()
  return entries
}

function writeJsonEndpoints() {
  const db = new Database(fileURLToPath(new URL('../../db/machtblick.sqlite', import.meta.url)), { readonly: true })
  const publicDir = fileURLToPath(new URL('./public', import.meta.url))
  mkdirSync(`${publicDir}/api`, { recursive: true })
  writeFileSync(`${publicDir}/api/votes.json`, JSON.stringify(leanVotes(db)))
  writeFileSync(`${publicDir}/api/members.json`, JSON.stringify(leanMembers(db)))
  writeFileSync(`${publicDir}/api/parties.json`, JSON.stringify(leanParties(db)))
  writeFileSync(`${publicDir}/api/motions.json`, JSON.stringify(leanMotions(db)))
  const voteIds = db.prepare("SELECT id FROM votes WHERE term_id = ? AND procedural = 0 AND vote_type != 'hammelsprung'").all(CURRENT_TERM) as Array<{ id: string }>
  rmSync(`${publicDir}/votes`, { force: true, recursive: true })
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

function writeVotesFeed() {
  const db = new Database(fileURLToPath(new URL('../../db/machtblick.sqlite', import.meta.url)), { readonly: true })
  const votes = db.prepare(`
    SELECT id, date, title, clean_title, result, coalesce(summary_simplified, summary, subject, title) AS summary
    FROM votes WHERE term_id = ? AND procedural = 0 AND vote_type != 'hammelsprung'
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
writeSpeechesStatic()
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
