import Database from 'better-sqlite3'
import * as XLSX from 'xlsx'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { normalizeFractionLabel } from '../../abgeordnetenwatch-terms/parties.ts'

const db = new Database(fileURLToPath(new URL('../../../db/machtblick.sqlite', import.meta.url)))
const TERM_ID = Number(arg('--term') ?? 20)
const AW_PERIOD_ID = Number(arg('--aw-period') ?? 132)
const UA = 'machtblick-bundestag/0.1 (https://github.com/soli/machtblick; asoliman96@gmail.com)'
const LIST_URL = 'https://www.bundestag.de/ajax/filterlist/de/parlament/plenum/abstimmung/liste/462112-462112'
const AW = 'https://www.abgeordnetenwatch.de/api/v2'
const NAME_PARTICLES = new Set(['von', 'van', 'de', 'der', 'den', 'dos', 'da', 'di', 'du', 'le', 'la', 'zu'])
const MEMBER_ALIASES = new Map([
  ['thomas max ladzinski', 'ladzinski-thomas'],
  ['dr daniel zerbin', 'zerbin-prof-dr-daniel'],
])
let enodiaCookie = ''

type LinkItem = { date: string; title: string; pdfUrl: string | null; xlsxUrl: string; sourceId: number | null }
type VoteRow = { party: string; last: string; first: string; yes: number; no: number; abstain: number; invalid: number; absent: number }
type Mandate = {
  id: number
  id_external_administration: string | null
  politician: { id: number; label: string }
  start_date: string | null
  end_date: string | null
  electoral_data: {
    electoral_list: { label: string } | null
    constituency: { label: string } | null
    mandate_won: string | null
  } | null
  fraction_membership: Array<{ fraction: { label: string }; valid_from: string; valid_until: string | null }> | null
}
type AwMandatesResponse = { meta: { result: { total: number; count: number } }; data: Mandate[] }

const term = db.prepare('SELECT start_date AS startDate, end_date AS endDate FROM bundestag_terms WHERE id = ?').get(TERM_ID) as { startDate: string; endDate: string | null }
const existingMembers = db.prepare('SELECT id, first_name AS firstName, last_name AS lastName FROM members').all() as Array<{ id: string; firstName: string; lastName: string }>
const memberIdByKey = new Map(existingMembers.map((m) => [nameKey(m.firstName, m.lastName), m.id]))
const usedMemberIds = new Set(existingMembers.map((m) => m.id))

await importMandates()
await importVotes()

console.log('done')
db.close()

async function importMandates() {
  const mandates = await fetchAwMandates()
  let membersWritten = 0
  let mandatesWritten = 0
  let affiliationsWritten = 0
  db.transaction(() => {
    for (const mandate of mandates) {
      const name = splitAwName(mandate.politician.label)
      const memberId = resolveMemberId(name.first, name.last)
      db.prepare(`
        INSERT INTO members (id, name, first_name, last_name, bt_mdb_id)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET bt_mdb_id = coalesce(members.bt_mdb_id, excluded.bt_mdb_id)
      `).run(memberId, `${name.first} ${name.last}`, name.first, name.last, mandate.id_external_administration?.padStart(8, '0') ?? null)
      membersWritten++
      db.prepare(`
        INSERT INTO member_mandates (member_id, term_id, bt_mdb_id, aw_politician_id, aw_mandate_id, mandate_type, list_state, constituency_number, constituency_name, valid_from, valid_to)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(member_id, term_id, valid_from) DO UPDATE SET
          bt_mdb_id = excluded.bt_mdb_id,
          aw_politician_id = excluded.aw_politician_id,
          aw_mandate_id = excluded.aw_mandate_id,
          mandate_type = excluded.mandate_type,
          list_state = excluded.list_state,
          constituency_number = excluded.constituency_number,
          constituency_name = excluded.constituency_name,
          valid_to = excluded.valid_to
      `).run(
        memberId,
        TERM_ID,
        mandate.id_external_administration?.padStart(8, '0') ?? null,
        mandate.politician.id,
        mandate.id,
        mandateType(mandate),
        listState(mandate),
        constituency(mandate).number,
        constituency(mandate).name,
        mandate.start_date ?? term.startDate,
        mandate.end_date,
      )
      mandatesWritten++
      for (const fm of mandate.fraction_membership ?? []) {
        const party = normalizeFractionLabel(fm.fraction.label)
        if (!party) continue
        db.prepare(`
          INSERT INTO member_affiliations (member_id, term_id, party, valid_from, valid_to)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(member_id, term_id, valid_from) DO UPDATE SET party = excluded.party, valid_to = excluded.valid_to
        `).run(memberId, TERM_ID, party, fm.valid_from ?? mandate.start_date ?? term.startDate, fm.valid_until)
        affiliationsWritten++
      }
    }
  })()
  console.log(`mandates: ${mandates.length}; members upserted=${membersWritten}; mandates upserted=${mandatesWritten}; affiliations upserted=${affiliationsWritten}`)
}

async function importVotes() {
  const links = (await fetchVoteLinks()).filter((l) => l.date >= term.startDate && (!term.endDate || l.date <= term.endDate))
  let votesWritten = 0
  let memberVotesWritten = 0
  for (const link of links) {
    const rows = await fetchVoteRows(link.xlsxUrl)
    const first = rows[0]
    if (!first) continue
    const generatedVoteId = `bt${TERM_ID}-${link.date}-${String(first.session).padStart(3, '0')}-${first.number}-${slugify(link.title)}`
    const existingVote = link.sourceId ? db.prepare('SELECT id FROM votes WHERE term_id = ? AND bundestag_id = ?').get(TERM_ID, link.sourceId) as { id: string } | undefined : null
    const voteId = existingVote?.id ?? generatedVoteId
    const counts = countRows(rows)
    const partySummaries = summaries(rows)
    db.transaction(() => {
      db.prepare(`
        INSERT INTO votes (id, term_id, bundestag_id, vote_type, date, title, clean_title, summary, document, result, total_members, yes, no, abstain, absent, source_url, fetched_at)
        VALUES (?, ?, ?, 'namentlich', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          bundestag_id = coalesce(votes.bundestag_id, excluded.bundestag_id),
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
          fetched_at = excluded.fetched_at
      `).run(
        voteId,
        TERM_ID,
        link.sourceId,
        link.date,
        link.title,
        link.title,
        `${counts.yes} Ja, ${counts.no} Nein, ${counts.abstain} Enthaltungen.`,
        link.title,
        counts.yes > counts.no ? 'angenommen' : 'abgelehnt',
        counts.total,
        counts.yes,
        counts.no,
        counts.abstain,
        counts.absent,
        link.xlsxUrl,
        new Date().toISOString(),
      )
      db.prepare('DELETE FROM vote_documents WHERE vote_id = ?').run(voteId)
      if (link.pdfUrl) db.prepare('INSERT INTO vote_documents (vote_id, label, title, url) VALUES (?, ?, ?, ?)').run(voteId, `${TERM_ID}/${first.session}/${first.number}`, link.title, link.pdfUrl)
      db.prepare('INSERT INTO vote_documents (vote_id, label, title, url) VALUES (?, ?, ?, ?)').run(voteId, 'XLSX', link.title, link.xlsxUrl)
      db.prepare('DELETE FROM vote_party_summaries WHERE vote_id = ?').run(voteId)
      for (const s of partySummaries) {
        db.prepare(`
          INSERT INTO vote_party_summaries (vote_id, party, position, members, yes, no, abstain, absent)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(voteId, s.party, s.position, s.members, s.yes, s.no, s.abstain, s.absent)
      }
      db.prepare('DELETE FROM vote_members WHERE vote_id = ?').run(voteId)
      for (const row of rows) {
        const memberId = resolveMemberId(row.first, row.last)
        db.prepare(`
          INSERT INTO members (id, name, first_name, last_name)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(id) DO NOTHING
        `).run(memberId, `${row.first} ${row.last}`, row.first, row.last)
        db.prepare(`
          INSERT INTO vote_members (vote_id, member_id, party, state, choice)
          VALUES (?, ?, ?, '', ?)
        `).run(voteId, memberId, row.party, choice(row))
        memberVotesWritten++
      }
    })()
    votesWritten++
  }
  console.log(`namentliche votes: ${votesWritten}; ballots: ${memberVotesWritten}`)
}

async function fetchAwMandates() {
  const out: Mandate[] = []
  let start = 0
  const size = 200
  while (true) {
    const res = await fetch(`${AW}/candidacies-mandates?parliament_period=${AW_PERIOD_ID}&type=mandate&range_start=${start}&range_end=${size}`, { headers: { 'User-Agent': UA, Accept: 'application/json' } })
    if (!res.ok) throw new Error(`AW mandates ${res.status}: ${await res.text()}`)
    const json = (await res.json()) as AwMandatesResponse
    out.push(...json.data)
    if (json.data.length < size) return out
    start += size
  }
}

async function fetchVoteLinks() {
  const out: LinkItem[] = []
  for (let offset = 0; ; offset += 30) {
    const html = await fetchBundestag(`${LIST_URL}?offset=${offset}&limit=30`).then((r) => r.text())
    const hits = Number(html.match(/data-hits="(\d+)"/)?.[1] ?? 0)
    for (const row of html.matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
      const body = row[1]
      const xlsxUrl = body.match(/href="([^"]+_xls\.xlsx)"/)?.[1]
      if (!xlsxUrl) continue
      const pdfUrl = body.match(/href="([^"]+\.pdf)"/)?.[1] ?? null
      const label = text(body.match(/<strong>\s*([\s\S]*?)\s*<\/strong>/)?.[1] ?? '')
      const date = parseDate(label.match(/^(\d{2}\.\d{2}\.\d{4})/)?.[1] ?? text(body.match(/data-th="Veröffentlichung"[\s\S]*?<p>\s*([\s\S]*?)\s*<\/p>/)?.[1] ?? ''))
      const title = label.replace(/^\d{2}\.\d{2}\.\d{4,5}:\s*/, '').trim()
      const sourceId = Number(body.match(/abstimmung\?id=(\d+)/)?.[1] ?? 0) || null
      if (date && title) out.push({ date, title, pdfUrl, xlsxUrl, sourceId })
    }
    if (offset + 30 >= hits) return out
  }
}

async function fetchVoteRows(url: string) {
  const res = await fetchBundestag(url)
  if (!res.ok) throw new Error(`XLSX ${res.status}: ${url}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1, defval: null, raw: false }).slice(1) as unknown[][]
  return rows.map((r) => ({
    term: Number(r[0]),
    session: Number(r[1]),
    number: Number(r[2]),
    party: normalizeParty(String(r[3] ?? '')),
    last: String(r[4] ?? '').trim(),
    first: String(r[5] ?? '').trim(),
    yes: Number(r[7] ?? 0),
    no: Number(r[8] ?? 0),
    abstain: Number(r[9] ?? 0),
    invalid: Number(r[10] ?? 0),
    absent: Number(r[11] ?? 0),
  })).filter((r) => r.term === TERM_ID && r.party && r.last && r.first)
}

function summaries(rows: ReturnType<typeof countableRows>) {
  const byParty = new Map<string, { party: string; members: number; yes: number; no: number; abstain: number; absent: number }>()
  for (const row of rows) {
    const s = byParty.get(row.party) ?? { party: row.party, members: 0, yes: 0, no: 0, abstain: 0, absent: 0 }
    const c = choice(row)
    s.members++
    s.yes += c === 'ja' ? 1 : 0
    s.no += c === 'nein' ? 1 : 0
    s.abstain += c === 'enthalten' ? 1 : 0
    s.absent += c === 'nicht_abgegeben' ? 1 : 0
    byParty.set(row.party, s)
  }
  return [...byParty.values()].map((s) => ({ ...s, position: position(s) }))
}

function countRows(rows: ReturnType<typeof countableRows>) {
  return rows.reduce((a, r) => ({
    total: a.total + 1,
    yes: a.yes + (choice(r) === 'ja' ? 1 : 0),
    no: a.no + (choice(r) === 'nein' ? 1 : 0),
    abstain: a.abstain + (choice(r) === 'enthalten' ? 1 : 0),
    absent: a.absent + (choice(r) === 'nicht_abgegeben' ? 1 : 0),
  }), { total: 0, yes: 0, no: 0, abstain: 0, absent: 0 })
}

function countableRows() {
  return [] as Array<VoteRow & { term: number; session: number; number: number }>
}

function choice(row: VoteRow) {
  if (row.yes) return 'ja'
  if (row.no) return 'nein'
  if (row.abstain) return 'enthalten'
  return 'nicht_abgegeben'
}

function position(s: { yes: number; no: number; abstain: number }) {
  if (s.yes > s.no && s.yes > s.abstain) return 'yes'
  if (s.no > s.yes && s.no > s.abstain) return 'no'
  if (s.abstain > s.yes && s.abstain > s.no) return 'abstain'
  return 'mixed'
}

function resolveMemberId(first: string, last: string) {
  const key = nameKey(first, last)
  const alias = MEMBER_ALIASES.get(key)
  if (alias) return alias
  const existing = memberIdByKey.get(key)
  if (existing) return existing
  const base = slugify(`${last}-${first.split(/\s+/)[0] ?? first}`)
  let id = base
  let suffix = 2
  while (usedMemberIds.has(id)) {
    id = `${base}-${suffix}`
    suffix++
  }
  memberIdByKey.set(key, id)
  usedMemberIds.add(id)
  return id
}

function normalizeParty(raw: string) {
  return normalizeFractionLabel(raw.replace('BÜ90/GR', 'Bündnis 90/Die Grünen').replace('Fraktionslos', 'fraktionslos')) ?? raw
}

function mandateType(mandate: Mandate) {
  const won = mandate.electoral_data?.mandate_won
  return won === 'constituency' ? 'direkt' : won === 'list' || mandate.electoral_data?.electoral_list ? 'liste' : null
}

function listState(mandate: Mandate) {
  return mandate.electoral_data?.electoral_list?.label.match(/^Landesliste\s+(.+?)\s+\(/)?.[1] ?? null
}

function constituency(mandate: Mandate) {
  const match = mandate.electoral_data?.constituency?.label.match(/^(\d+)\s+-\s+(.+?)\s+\(/)
  return { number: match?.[1] ?? null, name: match?.[2] ?? null }
}

function splitAwName(label: string) {
  const parts = label.trim().split(/\s+/)
  const lastStart = parts.length > 2 && NAME_PARTICLES.has(parts.at(-2)!.toLowerCase()) ? parts.length - 2 : parts.length - 1
  return { first: parts.slice(0, lastStart).join(' '), last: parts.slice(lastStart).join(' ') }
}

function parseDate(raw: string) {
  const trimmed = raw.trim()
  const numeric = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
  if (numeric) return `${numeric[3]}-${numeric[2]}-${numeric[1]}`
  const long = trimmed.match(/^(\d{1,2})\.\s+([A-Za-zäöüÄÖÜ]+)\s+(\d{4})$/)
  if (!long) return null
  return `${long[3]}-${String(month(long[2])).padStart(2, '0')}-${long[1].padStart(2, '0')}`
}

function month(name: string) {
  return ['januar', 'februar', 'märz', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'dezember'].indexOf(name.toLowerCase()) + 1
}

function text(html: string) {
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()
}

async function fetchBundestag(url: string) {
  const res = await fetch(url, { headers: enodiaCookie ? { 'User-Agent': UA, Cookie: enodiaCookie } : { 'User-Agent': UA } })
  if (!res.headers.get('content-type')?.includes('text/html')) return res
  const body = await res.clone().text()
  if (!body.includes('Enodia Verification')) return res
  const envelope = body.match(/window\.chl\s*=\s*"([^"]+)"/)?.[1]
  if (!envelope) return res
  const challenge = JSON.parse(Buffer.from(envelope.split('.')[0], 'base64url').toString()).content.challenge as string
  const key = await fetch('https://www.bundestag.de/.enodia/verify', {
    method: 'POST',
    headers: enodiaCookie ? { 'User-Agent': UA, Cookie: enodiaCookie } : { 'User-Agent': UA },
    body: `${solvePow(challenge)}-${envelope}`,
  }).then((r) => r.text())
  enodiaCookie = `enodia=${key}`
  return await fetch(url, { headers: { 'User-Agent': UA, Cookie: enodiaCookie } })
}

function solvePow(challenge: string) {
  let sol = 0
  while (createHash('sha256').update(`${challenge}${sol}`).digest('hex').slice(0, 4) !== '0000') sol++
  return sol
}

function nameKey(first: string, last: string) {
  return `${first} ${last}`.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, ' ').trim()
}

function slugify(input: string) {
  return input.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 96)
}

function arg(name: string) {
  const i = process.argv.indexOf(name)
  return i === -1 ? null : process.argv[i + 1]
}
