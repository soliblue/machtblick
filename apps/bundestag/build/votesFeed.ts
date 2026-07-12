import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { plainDescription, SITE_URL } from '../src/lib/seo'
import { CURRENT_TERM } from '../src/server/term'
import { openDb } from './shared'

export function writeVotesFeed() {
  const db = openDb()
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
  writeFileSync(fileURLToPath(new URL('../public/votes.xml', import.meta.url)), xml)
}
