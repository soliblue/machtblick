import Database from 'better-sqlite3'
import { fileURLToPath } from 'node:url'
import { readFileSync, existsSync } from 'node:fs'

const xmlRoot = fileURLToPath(new URL('../../../bundestag-reden-xml/raw/xml/', import.meta.url))
const db = new Database(fileURLToPath(new URL('../../../../db/machtblick.sqlite', import.meta.url)))

function loadXml(period, sitzung) {
  const path = `${xmlRoot}${period}${String(sitzung).padStart(3, '0')}.xml`
  return existsSync(path) ? readFileSync(path, 'utf8') : null
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
}

function normalize(s) {
  return s.replace(/\s+/g, ' ').trim().toLowerCase()
}

function paragraphs(xml) {
  const out = []
  const re = /<p\s+klasse="([^"]+)">([\s\S]*?)<\/p>/g
  let m
  while ((m = re.exec(xml)) !== null) out.push({ klasse: m[1], text: stripTags(m[2]).replace(/\s+/g, ' ').trim() })
  return out
}

function topBlockForTitle(ps, title) {
  const wanted = normalize(title)
  const idx = ps.findIndex((p) => p.klasse === 'T_fett' && normalize(p.text) === wanted)
  if (idx === -1) return null
  let start = idx
  for (let i = idx - 1; i >= 0; i--) {
    if (ps[i].klasse === 'T_fett') { start = i + 1; break }
    if (/^\s*(TOP|ZP)\s/i.test(ps[i].text) && ps[i].klasse === 'T_ZP_NaS') { start = i; break }
    start = i
  }
  let end = idx
  for (let i = idx + 1; i < ps.length; i++) {
    if (ps[i].klasse === 'T_fett') break
    if (/^\s*(TOP|ZP)\s/i.test(ps[i].text) && ps[i].klasse === 'T_ZP_NaS') break
    end = i
  }
  return ps.slice(start, end + 1)
}

const PARTY_RE = /(?:Fraktion(?:en)?\s+(?:der\s+)?(AfD|SPD|FDP|CDU|CSU|Die\s*Linke|B(?:Ü|UE)NDNIS\s*90[^\s,]*|B(?:ü|u)ndnis\s*90[^\s,]*))|(\bBundesregierung\b)|(\bBundesrates\b)/gi

function normalizePartyName(s) {
  const t = s.replace(/\s+/g, ' ').trim()
  if (/AfD/i.test(t)) return 'AfD'
  if (/SPD/.test(t)) return 'SPD'
  if (/FDP/.test(t)) return 'FDP'
  if (/CDU/.test(t)) return 'CDU'
  if (/CSU/.test(t)) return 'CSU'
  if (/Linke/i.test(t)) return 'Die Linke'
  if (/B(?:Ü|UE|ü|u)NDNIS\s*90|B(?:ü|u)ndnis\s*90/i.test(t)) return 'B90/Grüne'
  if (/Bundesregierung/.test(t)) return 'Bundesregierung'
  if (/Bundesrates/.test(t)) return 'Bundesrat'
  return t
}

function distinctParties(ps) {
  const set = new Set()
  for (const p of ps) {
    for (const m of p.text.matchAll(PARTY_RE)) {
      const raw = m[1] || m[2] || m[3]
      if (raw) set.add(normalizePartyName(raw))
    }
  }
  return [...set]
}

const rows = db.prepare(`SELECT id, title, document, initiator FROM votes WHERE initiator IS NOT NULL ORDER BY id`).all()
const suspects = []

for (const v of rows) {
  const m = v.id.match(/^pp(\d+)-(\d+)-/)
  if (!m) continue
  const xml = loadXml(Number(m[1]), Number(m[2]))
  if (!xml || !v.title) continue
  const ps = paragraphs(xml)
  const block = topBlockForTitle(ps, v.title.replace(/\s*\([^)]+\)\s*$/, '').trim())
  if (!block) continue
  const parties = distinctParties(block)
  if (parties.length > 1) suspects.push({ id: v.id, initiator: v.initiator, parties })
}

console.log(`suspects: ${suspects.length} of ${rows.length}`)
for (const s of suspects) {
  console.log(`  ${s.id}  current=${s.initiator}  seen=[${s.parties.join(', ')}]`)
}
db.close()
