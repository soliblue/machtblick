import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { DONATION_PARTY_NAMES, SLUG_TO_PARTY } from '../src/lib/parties'
import { SITE_URL } from '../src/lib/seo'
import { CURRENT_TERM } from '../src/server/term'
import { openDb, partySlugs, publishableAntragIds, publishableMembers, publishableVotes } from './shared'

type SitemapEntry = { path: string; lastmod?: string }

function sitemapEntries(): SitemapEntry[] {
  const db = openDb()
  const latest = (db.prepare('SELECT max(date) AS d FROM votes WHERE term_id = ?').get(CURRENT_TERM) as { d: string | null }).d ?? undefined
  const entries: SitemapEntry[] = [
    ...['/', '/members/', '/parties/', '/speeches/', '/en/', '/en/members/', '/en/parties/', '/en/speeches/'].map((path) => ({ path, lastmod: latest })),
    { path: '/imprint/' },
    { path: '/privacy/' },
    { path: '/methodology/' },
    { path: '/en/imprint/' },
    { path: '/en/privacy/' },
    { path: '/en/methodology/' },
  ]
  for (const v of publishableVotes(db)) {
    entries.push({ path: `/votes/${v.id}/`, lastmod: v.date })
    entries.push({ path: `/en/votes/${v.id}/`, lastmod: v.date })
  }
  const antragDates = new Map(
    (db.prepare(`
      SELECT a.id, max(
        coalesce(a.introduced_date, ''),
        coalesce((SELECT max(v.date) FROM vote_antraege va INNER JOIN votes v ON v.id = va.vote_id WHERE va.antrag_id = a.id), ''),
        coalesce(substr(a.updated_at, 1, 10), '')
      ) AS d
      FROM antraege a WHERE a.wahlperiode = ?
    `).all(CURRENT_TERM) as Array<{ id: number; d: string }>).map((r) => [r.id, r.d || undefined]),
  )
  const latestMotionActivity = [...antragDates.values()].filter((d): d is string => !!d).sort().pop()
  entries.push({ path: '/motions/', lastmod: latestMotionActivity })
  entries.push({ path: '/en/motions/', lastmod: latestMotionActivity })
  for (const id of publishableAntragIds(db)) entries.push({ path: `/motions/${id}/`, lastmod: antragDates.get(id) })
  for (const id of publishableAntragIds(db, 'en')) entries.push({ path: `/en/motions/${id}/`, lastmod: antragDates.get(id) })
  for (const m of publishableMembers(db)) {
    entries.push({ path: `/members/${m.id}/`, lastmod: m.lastModified })
    entries.push({ path: `/en/members/${m.id}/`, lastmod: m.lastModified })
  }
  for (const slug of partySlugs(db)) {
    const donationNames = DONATION_PARTY_NAMES[SLUG_TO_PARTY[slug]] ?? []
    const lastmod = donationNames.length
      ? (db.prepare(`
          SELECT max(d) AS d FROM (
            SELECT ? AS d
            UNION ALL
            SELECT date_notified AS d FROM party_donations
            WHERE party IN (${donationNames.map(() => '?').join(', ')})
          )
        `).get(latest ?? null, ...donationNames) as { d: string | null }).d ?? undefined
      : latest
    entries.push({ path: `/parties/${slug}/`, lastmod })
    entries.push({ path: `/en/parties/${slug}/`, lastmod })
  }
  db.close()
  return entries
}

export function writeSitemap() {
  const body = sitemapEntries()
    .map((e) => `  <url><loc>${SITE_URL}${e.path}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ''}</url>`)
    .join('\n')
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
  writeFileSync(fileURLToPath(new URL('../public/sitemap.xml', import.meta.url)), xml)
}
