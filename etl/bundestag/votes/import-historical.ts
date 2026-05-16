import Database from 'better-sqlite3'
import { XMLParser } from 'fast-xml-parser'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { normalizeFractionLabel } from '../../abgeordnetenwatch-terms/parties.ts'

const db = new Database(fileURLToPath(new URL('../../../db/machtblick.sqlite', import.meta.url)))
const xmlPath = fileURLToPath(new URL('../../bundestag-stammdaten/raw/MDB_STAMMDATEN.XML', import.meta.url))
const rawDir = fileURLToPath(new URL('./raw/', import.meta.url))
const currentPdfPath = `${rawDir}Kapitel_07_13_Namentliche_Abstimmungen.pdf`
const CURRENT_PDF_URL = 'https://www.bundestag.de/resource/blob/196300/Kapitel_07_13_Namentliche_Abstimmungen.pdf'
const EXPECTED_VOTES = new Map([[12, 129], [13, 180], [14, 164], [15, 102]])
const HONORIFICS = new Set(['dr', 'prof', 'med', 'hc', 'h', 'c', 'dent', 'rer', 'nat', 'phil', 'jur', 'ing', 'mult', 'habil', 'mag', 'lic', 'theol', 'dipl', 'pol'])
const NAME_PARTICLES = new Set(['von', 'van', 'de', 'der', 'den', 'dos', 'da', 'di', 'du', 'le', 'la', 'zu', 'auf', 'freiherr', 'graf', 'edler', 'edle', 'baron', 'baronin'])
const STATE_BY_LISTE: Record<string, string> = {
  BW: 'Baden-Württemberg',
  BY: 'Bayern',
  BE: 'Berlin',
  BB: 'Brandenburg',
  HB: 'Bremen',
  HH: 'Hamburg',
  HE: 'Hessen',
  MV: 'Mecklenburg-Vorpommern',
  NI: 'Niedersachsen',
  NW: 'Nordrhein-Westfalen',
  RP: 'Rheinland-Pfalz',
  SL: 'Saarland',
  SN: 'Sachsen',
  ST: 'Sachsen-Anhalt',
  SH: 'Schleswig-Holstein',
  TH: 'Thüringen',
}

type NameXml = { NACHNAME: string; VORNAME: string }
type InstitutionXml = { INSART_LANG?: string; INS_LANG?: string; MDBINS_VON?: string; MDBINS_BIS?: string }
type WpXml = {
  WP: string | number
  MDBWP_VON?: string
  MDBWP_BIS?: string
  MANDATSART?: string
  LISTE?: string
  WKR_NUMMER?: string | number
  WKR_NAME?: string
  WKR_LAND?: string
  INSTITUTIONEN?: { INSTITUTION?: InstitutionXml | InstitutionXml[] }
}
type MdbXml = { ID: string | number; NAMEN: { NAME: NameXml | NameXml[] }; WAHLPERIODEN: { WAHLPERIODE: WpXml | WpXml[] } }
type PdfItem = { text: string; x: number; y: number }
type VoteRow = {
  id: string
  termId: number
  lfd: number
  date: string
  title: string
  result: 'angenommen' | 'abgelehnt'
  total: number | null
  yes: number | null
  no: number | null
  abstain: number | null
  absent: number | null
  summary: string
  documents: string[]
  context: string
}

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '', textNodeName: '_text' })
const tree = parser.parse(readFileSync(xmlPath, 'utf8')) as { DOCUMENT: { MDB: MdbXml[] } }
const allMdbs = asArray(tree.DOCUMENT.MDB)
const members = db.prepare('SELECT id, first_name AS firstName, last_name AS lastName, bt_mdb_id AS btMdbId FROM members').all() as Array<{ id: string; firstName: string; lastName: string; btMdbId: string | null }>
const membersByKey = new Map<string, typeof members>()
for (const member of members) membersByKey.set(nameKey(member.firstName, member.lastName), [...(membersByKey.get(nameKey(member.firstName, member.lastName)) ?? []), member])
const memberIdByMdbId = new Map(members.filter((m) => m.btMdbId).map((m) => [m.btMdbId!, m.id]))
const usedMemberIds = new Set(members.map((m) => m.id))

if (!existsSync(rawDir)) mkdirSync(rawDir, { recursive: true })
if (!existsSync(currentPdfPath)) {
  const res = await fetch(CURRENT_PDF_URL, { headers: { 'User-Agent': 'machtblick-etl' } })
  if (!res.ok) throw new Error(`fetch ${CURRENT_PDF_URL}: ${res.status}`)
  writeFileSync(currentPdfPath, Buffer.from(await res.arrayBuffer()))
}

const termsWritten = importTerms()
const historicalMembers = importMembers()
const votes = await extractVotes()
importVotes(votes)
validateVotes(votes)

console.log(`historical terms upserted=${termsWritten}`)
console.log(`historical members upserted=${historicalMembers.members}; mandates upserted=${historicalMembers.mandates}; affiliations upserted=${historicalMembers.affiliations}`)
console.log(`historical named votes upserted=${votes.length}; special rows=${votes.filter((v) => v.yes === null).length}`)

db.close()

function importTerms() {
  const byTerm = new Map<number, WpXml[]>()
  for (const mdb of allMdbs) {
    for (const wp of asArray(mdb.WAHLPERIODEN.WAHLPERIODE)) {
      const termId = Number(wp.WP)
      if (termId >= 1 && termId <= 15) byTerm.set(termId, [...(byTerm.get(termId) ?? []), wp])
    }
  }
  let written = 0
  db.transaction(() => {
    for (const [termId, wps] of [...byTerm.entries()].sort((a, b) => a[0] - b[0])) {
      const starts = wps.map((wp) => parseGermanDate(wp.MDBWP_VON)).filter((d): d is string => Boolean(d)).sort()
      const ends = wps.map((wp) => parseGermanDate(wp.MDBWP_BIS)).filter((d): d is string => Boolean(d)).sort()
      const start = starts[0]
      const totalSeats = wps.filter((wp) => {
        const from = parseGermanDate(wp.MDBWP_VON)
        const to = parseGermanDate(wp.MDBWP_BIS)
        return from && from <= start && (!to || to >= start)
      }).length
      db.prepare(`
        INSERT INTO bundestag_terms (id, number, start_date, end_date, total_seats)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          number = excluded.number,
          start_date = excluded.start_date,
          end_date = excluded.end_date,
          total_seats = excluded.total_seats
      `).run(termId, termId, start, ends.at(-1) ?? null, totalSeats)
      written++
    }
  })()
  return written
}

function importMembers() {
  let membersWritten = 0
  let mandatesWritten = 0
  let affiliationsWritten = 0
  db.transaction(() => {
    db.prepare('DELETE FROM member_affiliations WHERE term_id BETWEEN 1 AND 15').run()
    db.prepare('DELETE FROM member_mandates WHERE term_id BETWEEN 1 AND 15').run()
    for (const mdb of allMdbs) {
      const btMdbId = String(mdb.ID).padStart(8, '0')
      const name = asArray(mdb.NAMEN.NAME).at(-1)!
      const memberId = resolveMemberId(btMdbId, name.VORNAME, name.NACHNAME)
      const relevantWps = asArray(mdb.WAHLPERIODEN.WAHLPERIODE).filter((wp) => Number(wp.WP) >= 1 && Number(wp.WP) <= 15)
      if (!relevantWps.length) continue
      db.prepare(`
        INSERT INTO members (id, name, first_name, last_name, bt_mdb_id)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET bt_mdb_id = coalesce(members.bt_mdb_id, excluded.bt_mdb_id)
      `).run(memberId, `${name.VORNAME} ${name.NACHNAME}`, name.VORNAME, name.NACHNAME, btMdbId)
      membersWritten++
      for (const wp of relevantWps) {
        const termId = Number(wp.WP)
        const validFrom = parseGermanDate(wp.MDBWP_VON)
        const validTo = parseGermanDate(wp.MDBWP_BIS)
        db.prepare(`
          INSERT INTO member_mandates (member_id, term_id, bt_mdb_id, aw_politician_id, aw_mandate_id, mandate_type, list_state, constituency_number, constituency_name, valid_from, valid_to)
          VALUES (?, ?, ?, NULL, NULL, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(member_id, term_id, valid_from) DO UPDATE SET
            bt_mdb_id = excluded.bt_mdb_id,
            mandate_type = excluded.mandate_type,
            list_state = excluded.list_state,
            constituency_number = excluded.constituency_number,
            constituency_name = excluded.constituency_name,
            valid_to = excluded.valid_to
        `).run(memberId, termId, btMdbId, mandateType(wp), listState(wp), wp.WKR_NUMMER ? String(wp.WKR_NUMMER) : null, wp.WKR_NAME ?? null, validFrom, validTo)
        mandatesWritten++
        for (const institution of asArray(wp.INSTITUTIONEN?.INSTITUTION).filter((i) => i.INSART_LANG === 'Fraktion/Gruppe')) {
          const party = historicalParty(institution.INS_LANG ?? '')
          if (!party) continue
          db.prepare(`
            INSERT INTO member_affiliations (member_id, term_id, party, valid_from, valid_to)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(member_id, term_id, valid_from) DO UPDATE SET party = excluded.party, valid_to = excluded.valid_to
          `).run(memberId, termId, party, parseGermanDate(institution.MDBINS_VON) ?? validFrom, parseGermanDate(institution.MDBINS_BIS) ?? validTo)
          affiliationsWritten++
        }
      }
    }
  })()
  return { members: membersWritten, mandates: mandatesWritten, affiliations: affiliationsWritten }
}

async function extractVotes() {
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(readFileSync(currentPdfPath)) }).promise
  const votes: VoteRow[] = []
  let termId: number | null = null
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber)
    const content = await page.getTextContent()
    const items = content.items
      .map((item: any) => ({ text: String(item.str ?? '').trim(), x: Number(item.transform[4]), y: Number(item.transform[5]) }))
      .filter((item: PdfItem) => item.text)
    const termMatch = lineText(items).match(/(\d+)\. Wahlperiode/)
    if (termMatch) termId = Number(termMatch[1])
    if (!termId || termId < 12 || termId > 15) continue
    const starts = items
      .filter((item) => item.x > 65 && item.x < 95 && /^\d+$/.test(item.text))
      .map((item) => ({ lfd: Number(item.text), y: item.y }))
      .filter((start) => items.some((item) => Math.abs(item.y - start.y) < 3 && item.x > 95 && item.x < 155 && /^\d{1,2}\.\d{1,2}\.\d{4}$/.test(item.text)))
      .sort((a, b) => b.y - a.y)
    for (let i = 0; i < starts.length; i++) {
      const segment = items.filter((item) => item.y <= starts[i].y + 4 && item.y >= (starts[i + 1]?.y ?? -4) + 4)
      const date = parseGermanDate(segment.find((item) => item.x > 95 && item.x < 155 && /^\d{1,2}\.\d{1,2}\.\d{4}$/.test(item.text))?.text)
      const count = segment.find((item) => item.x > 485 && item.x < 570 && /^\d+[:.]\d+:\d+$/.test(item.text))?.text.replace(/^(\d+)\.(\d+:\d+)$/, '$1:$2')
      const counts = count?.match(/^(\d+):(\d+):(\d+)$/)
      const decision = columnText(segment, 485, 575)
      const title = cleanTitle(columnText(segment, 145, 405))
      const yes = counts ? Number(counts[1]) : null
      const no = counts ? Number(counts[2]) : null
      const abstain = counts ? Number(counts[3]) : null
      const total = yes === null || no === null || abstain === null ? null : yes + no + abstain
      if (!date || !title) throw new Error(`unparsed historical vote row term=${termId} page=${pageNumber} lfd=${starts[i].lfd}`)
      votes.push({
        id: `bt${termId}-${String(starts[i].lfd).padStart(3, '0')}-${date}-${slugify(title).slice(0, 72)}`,
        termId,
        lfd: starts[i].lfd,
        date,
        title,
        result: yes === null || no === null ? decision.includes('Annahme') ? 'angenommen' : 'abgelehnt' : yes > no ? 'angenommen' : 'abgelehnt',
        total,
        yes,
        no,
        abstain,
        absent: total === null ? null : 0,
        summary: total === null ? decision || 'Sonderverfahren, siehe Datenhandbuch.' : `${yes} Ja, ${no} Nein, ${abstain} Enthaltungen.`,
        documents: [...new Set(title.match(/BT-Drs\. ?\d+\/\d+/g) ?? [])],
        context: JSON.stringify({ source: 'Datenhandbuch Kapitel 7.13', page: pageNumber, lfd: starts[i].lfd, decision }),
      })
    }
  }
  return votes
}

function importVotes(votes: VoteRow[]) {
  db.transaction(() => {
    const existing = db.prepare('SELECT id FROM votes WHERE term_id BETWEEN 12 AND 15 AND source_url = ?').all(CURRENT_PDF_URL) as Array<{ id: string }>
    for (const vote of existing) {
      db.prepare('DELETE FROM vote_documents WHERE vote_id = ?').run(vote.id)
      db.prepare('DELETE FROM vote_party_summaries WHERE vote_id = ?').run(vote.id)
      db.prepare('DELETE FROM vote_members WHERE vote_id = ?').run(vote.id)
      db.prepare('DELETE FROM votes WHERE id = ?').run(vote.id)
    }
    for (const vote of votes) {
      db.prepare(`
        INSERT INTO votes (id, term_id, bundestag_id, vote_type, date, title, clean_title, summary, document, result, total_members, yes, no, abstain, absent, source_url, context_json, fetched_at)
        VALUES (?, ?, NULL, 'namentlich', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          clean_title = excluded.clean_title,
          summary = excluded.summary,
          document = excluded.document,
          result = excluded.result,
          total_members = excluded.total_members,
          yes = excluded.yes,
          no = excluded.no,
          abstain = excluded.abstain,
          absent = excluded.absent,
          source_url = excluded.source_url,
          context_json = excluded.context_json,
          fetched_at = excluded.fetched_at
      `).run(vote.id, vote.termId, vote.date, vote.title, vote.title, vote.summary, vote.documents[0] ?? vote.title, vote.result, vote.total, vote.yes, vote.no, vote.abstain, vote.absent, CURRENT_PDF_URL, vote.context, new Date().toISOString())
      db.prepare('DELETE FROM vote_documents WHERE vote_id = ?').run(vote.id)
      for (const document of vote.documents) db.prepare('INSERT INTO vote_documents (vote_id, label, title, url) VALUES (?, ?, ?, ?)').run(vote.id, document, vote.title, CURRENT_PDF_URL)
      db.prepare('DELETE FROM vote_party_summaries WHERE vote_id = ?').run(vote.id)
      db.prepare('DELETE FROM vote_members WHERE vote_id = ?').run(vote.id)
    }
  })()
}

function validateVotes(votes: VoteRow[]) {
  for (const [termId, expected] of EXPECTED_VOTES) {
    const actual = votes.filter((vote) => vote.termId === termId).length
    if (actual !== expected) throw new Error(`term ${termId} expected ${expected} historical votes, got ${actual}`)
  }
}

function resolveMemberId(btMdbId: string, first: string, last: string) {
  const existingByMdbId = memberIdByMdbId.get(btMdbId)
  if (existingByMdbId) return existingByMdbId
  const key = nameKey(first, last)
  const existingByName = (membersByKey.get(key) ?? []).find((member) => !member.btMdbId)
  if (existingByName) {
    memberIdByMdbId.set(btMdbId, existingByName.id)
    return existingByName.id
  }
  const base = `${slugify(`${last}-${first.split(/\s+/)[0] ?? first}`)}-${btMdbId.slice(-4)}`
  let id = base
  let suffix = 2
  while (usedMemberIds.has(id)) {
    id = `${base}-${suffix}`
    suffix++
  }
  usedMemberIds.add(id)
  membersByKey.set(key, [...(membersByKey.get(key) ?? []), { id, firstName: first, lastName: last, btMdbId }])
  memberIdByMdbId.set(btMdbId, id)
  return id
}

function mandateType(wp: WpXml) {
  const raw = (wp.MANDATSART ?? '').toLowerCase()
  return raw.includes('direkt') ? 'direkt' : raw.includes('liste') ? 'liste' : null
}

function listState(wp: WpXml) {
  const code = wp.LISTE ? String(wp.LISTE) : null
  return code ? STATE_BY_LISTE[code] ?? code : null
}

function historicalParty(raw: string) {
  const normalized = normalizeFractionLabel(raw.replace('BÜNDNIS 90/DIE GRÜNEN', 'Bündnis 90/Die Grünen').replace('Fraktionslos', 'fraktionslos'))
  if (normalized) return normalized
  const stripped = raw
    .replace(/^Fraktion der /, '')
    .replace(/^Fraktion /, '')
    .replace(/^Gruppe der /, '')
    .replace(/^Gruppe /, '')
    .replace(/\s+\(Gast\)$/, '')
    .replace(/\s+/g, ' ')
    .trim()
  const map: Record<string, string> = {
    'Christlich Demokratischen Union/Christlich - Sozialen Union': 'CDU/CSU',
    'Freien Demokratischen Partei': 'FDP',
    'Sozialdemokratischen Partei Deutschlands': 'SPD',
    'Kommunistischen Partei Deutschlands': 'KPD',
    'Partei des Demokratischen Sozialismus': 'PDS',
    'Partei des Demokratischen Sozialismus/Linke Liste': 'PDS/Linke Liste',
    'Bündnis 90/Die Grünen': 'B90/Grüne',
    'Die Grünen': 'Grüne',
    'Die Grünen/Bündnis 90': 'Grüne/B90',
    'Deutsche Partei': 'DP',
    'Deutsche Partei Bayern': 'DPB',
    'Deutsche Partei/Deutsche Partei Bayern': 'DP/DPB',
    'Deutsche Partei/Freie Volkspartei': 'DP/FVP',
    'Deutsche Reichspartei': 'DRP',
    'Deutsche Reichspartei/Nationale Rechte': 'DRP/NR',
    'Deutsche Zentrums-Partei': 'Zentrum',
    'Deutscher Gemeinschaftsblock der Heimatvertriebenen und Entrechteten': 'GB/BHE',
    'Gesamtdeutscher Block / Block der Heimatvertriebenen und Entrechteten': 'GB/BHE',
    'Föderalistische Union': 'FU',
    'Freie Volkspartei': 'FVP',
    'Wirtschaftliche Aufbauvereinigung': 'WAV',
    'Demokratische Arbeitsgemeinschaft': 'DA',
    'Bayernpartei': 'BP',
    'Kraft/Oberländer': 'Kraft/Oberländer',
    fraktionslos: 'fraktionslos',
  }
  return map[stripped] ?? stripped
}

function asArray<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value : value ? [value] : []
}

function parseGermanDate(raw: string | null | undefined) {
  const match = raw?.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  return match ? `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}` : null
}

function columnText(items: PdfItem[], minX: number, maxX: number) {
  return lineText(items.filter((item) => item.x > minX && item.x < maxX))
}

function lineText(items: PdfItem[]) {
  return [...items].sort((a, b) => b.y - a.y || a.x - b.x).map((item) => item.text).join(' ').replace(/\s+/g, ' ').trim()
}

function cleanTitle(title: string) {
  return title.replace(/\s+1\s+abgestuftes Verfahren\s+:\s+/, ' abgestuftes Verfahren: ').replace(/\s+/g, ' ').trim()
}

function nameKey(first: string, last: string) {
  return strip(`${first} ${last}`)
}

function strip(value: string) {
  return value.toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ').filter((part) => part && !HONORIFICS.has(part) && !NAME_PARTICLES.has(part)).join(' ')
}

function slugify(input: string) {
  return input.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 96)
}
