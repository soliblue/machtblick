import Database from 'better-sqlite3'
import * as XLSX from 'xlsx'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { normalizeFractionLabel } from '../../_shared/parties.ts'
import { HONORIFICS, NAME_PARTICLES } from '../../_shared/names.ts'
import { AW_API, AW_UA } from '../../_shared/awClient.ts'
import { DETAIL_BALLOT_LABEL, needsXlsxRefresh, parseDetailBallots } from './detailBallots.ts'

const db = new Database(fileURLToPath(new URL('../../../db/machtblick.sqlite', import.meta.url)))
const TERM_ID = Number(arg('--term') ?? 21)
const AW_PERIOD_ID = Number(arg('--aw-period') ?? 161)
const LIST_URL = 'https://www.bundestag.de/ajax/filterlist/de/parlament/plenum/abstimmung/liste/462112-462112'
const DETAIL_LIST_URL = 'https://www.bundestag.de/ajax/filterlist/de/parlament/plenum/abstimmung/abstimmungen/484422-484422'
const DETAIL_ROWS_URL = 'https://www.bundestag.de/apps/na/namensliste.form'
const SOURCE_ID = Number(arg('--source-id') ?? 0) || null
const MEMBER_ALIASES = new Map([
  ['inge graessle', 'grassle-ingeborg'],
  ['isabel cademartori', 'cademartori-dujisin-isabel'],
  ['thomas max ladzinski', 'ladzinski-thomas'],
  ['daniel zerbin', 'zerbin-prof-dr-daniel'],
])
let enodiaCookie = ''

type LinkItem = { date: string; title: string; description: string | null; initiator: string | null; pdfUrl: string | null; xlsxUrl: string | null; sourceUrl: string; sourceId: number | null }
type DetailItem = { date: string; title: string; description: string; initiator: string | null; sourceId: number }
type ExistingVote = { id: string; title: string; cleanTitle: string | null }
type VoteRow = { party: string; state: string | null; last: string; first: string; session: number | null; number: number | null; yes: number; no: number; abstain: number; absent: number }
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
const existingMembers = db.prepare('SELECT id, first_name AS firstName, last_name AS lastName, bt_mdb_id AS btMdbId FROM members').all() as Array<{ id: string; firstName: string; lastName: string; btMdbId: string | null }>
const keyMaps = [new Map<string, string[]>(), new Map<string, string[]>(), new Map<string, string[]>()]
for (const m of existingMembers) registerMemberKeys(m.id, m.firstName, m.lastName)
const memberIdByMdbId = new Map(existingMembers.filter((m) => m.btMdbId).map((m) => [m.btMdbId!, m.id]))
const termMemberIds = new Set((db.prepare('SELECT DISTINCT member_id AS id FROM member_mandates WHERE term_id = ?').all(TERM_ID) as Array<{ id: string }>).map((r) => r.id))
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
      const mdbId = mandate.id_external_administration?.padStart(8, '0') ?? null
      const memberId = (mdbId ? memberIdByMdbId.get(mdbId) : null) ?? resolveMemberId(name.first, name.last)
      if (mdbId) memberIdByMdbId.set(mdbId, memberId)
      termMemberIds.add(memberId)
      db.prepare(`
        INSERT INTO members (id, name, first_name, last_name, bt_mdb_id)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET bt_mdb_id = COALESCE(members.bt_mdb_id, excluded.bt_mdb_id)
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

function loadMemberStates() {
  const out = new Map<string, string>()
  for (const row of db.prepare(`
    SELECT vm.member_id AS id, vm.state AS state, COUNT(*) AS n FROM vote_members vm
    JOIN votes v ON v.id = vm.vote_id
    WHERE v.term_id = ? AND vm.state != ''
    GROUP BY vm.member_id, vm.state ORDER BY n
  `).all(TERM_ID) as Array<{ id: string; state: string }>) out.set(row.id, row.state)
  for (const row of db.prepare("SELECT id, list_state AS state FROM members WHERE list_state IS NOT NULL AND list_state != ''").all() as Array<{ id: string; state: string }>) out.set(row.id, row.state)
  for (const row of db.prepare('SELECT member_id AS id, list_state AS state FROM member_mandates WHERE term_id = ? AND list_state IS NOT NULL').all(TERM_ID) as Array<{ id: string; state: string }>) out.set(row.id, row.state)
  return out
}

async function importVotes() {
  const stateByMember = loadMemberStates()
  const links = (await fetchVoteLinks()).filter((l) => l.date >= term.startDate && (!term.endDate || l.date <= term.endDate) && (!SOURCE_ID || l.sourceId === SOURCE_ID))
  if (SOURCE_ID && links.length === 0) throw new Error(`Bundestag source id ${SOURCE_ID} not found`)
  const latestExisting = db.prepare("SELECT MAX(date) AS date FROM votes WHERE term_id = ? AND vote_type = 'namentlich'").get(TERM_ID) as { date: string | null }
  const insertVoteDocument = db.prepare(`
    INSERT INTO vote_documents (vote_id, label, title, url)
    SELECT ?, ?, ?, ?
    WHERE NOT EXISTS (
      SELECT 1 FROM vote_documents WHERE vote_id = ? AND label = ? AND url = ?
    )
  `)
  let votesWritten = 0
  let memberVotesWritten = 0
  for (const link of links) {
    if (!link.sourceId && latestExisting.date && link.date <= latestExisting.date) continue
    const existingVote = db.prepare(`
      SELECT v.id, v.inverted, EXISTS (
        SELECT 1 FROM vote_documents vd WHERE vd.vote_id = v.id AND vd.label = 'XLSX'
      ) AS hasXlsx, EXISTS (
        SELECT 1 FROM vote_documents vd WHERE vd.vote_id = v.id AND vd.label = ?
      ) AS hasDetailBallots
      FROM votes v
      WHERE v.term_id = ? AND v.bundestag_id = ?
    `).get(DETAIL_BALLOT_LABEL, TERM_ID, link.sourceId) as { id: string; inverted: number; hasXlsx: number; hasDetailBallots: number } | undefined
    if (!SOURCE_ID && existingVote && latestExisting.date && link.date <= latestExisting.date && !needsXlsxRefresh(Boolean(link.xlsxUrl), Boolean(existingVote.hasXlsx), Boolean(existingVote.hasDetailBallots))) continue
    const rows = link.xlsxUrl ? await fetchVoteRows(link.xlsxUrl) : await fetchDetailVoteRows(link.sourceId!)
    const first = rows[0]
    if (!first) continue
    const generatedVoteId = link.sourceId ? `${link.date}-${link.sourceId}-${slugify(link.title)}` : `bt${TERM_ID}-${link.date}-${String(first.session).padStart(3, '0')}-${first.number}-${slugify(link.title)}`
    if (!existingVote && link.sourceId) deleteFallbackVote(link, generatedVoteId)
    const voteId = existingVote?.id ?? generatedVoteId
    const counts = countRows(rows)
    const partySummaries = summaries(rows)
    db.transaction(() => {
      db.prepare(`
        INSERT INTO votes (id, term_id, bundestag_id, vote_type, date, title, clean_title, summary, document, initiator, result, total_members, yes, no, abstain, absent, source_url, fetched_at)
        VALUES (?, ?, ?, 'namentlich', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          bundestag_id = COALESCE(votes.bundestag_id, excluded.bundestag_id),
          title = CASE WHEN votes.inverted = 1 THEN votes.title ELSE excluded.title END,
          clean_title = COALESCE(votes.clean_title, excluded.clean_title),
          summary = CASE WHEN votes.inverted = 1 THEN votes.summary ELSE excluded.summary END,
          document = excluded.document,
          initiator = COALESCE(votes.initiator, excluded.initiator),
          result = CASE WHEN votes.inverted = 1 THEN votes.result ELSE excluded.result END,
          total_members = excluded.total_members,
          yes = CASE WHEN votes.inverted = 1 THEN votes.yes ELSE excluded.yes END,
          no = CASE WHEN votes.inverted = 1 THEN votes.no ELSE excluded.no END,
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
        null,
        `${counts.yes} Ja, ${counts.no} Nein, ${counts.abstain} Enthaltungen.`,
        link.description ?? link.title,
        link.initiator,
        counts.yes > counts.no ? 'angenommen' : 'abgelehnt',
        counts.total,
        counts.yes,
        counts.no,
        counts.abstain,
        counts.absent,
        link.sourceUrl,
        new Date().toISOString(),
      )
      if (link.pdfUrl) insertVoteDocument.run(voteId, `${TERM_ID}/${first.session}/${first.number}`, link.title, link.pdfUrl, voteId, `${TERM_ID}/${first.session}/${first.number}`, link.pdfUrl)
      if (link.xlsxUrl) insertVoteDocument.run(voteId, 'XLSX', link.title, link.xlsxUrl, voteId, 'XLSX', link.xlsxUrl)
      if (!link.xlsxUrl && link.sourceId) {
        const detailRowsUrl = `${DETAIL_ROWS_URL}?id=${link.sourceId}&ajax=true`
        insertVoteDocument.run(voteId, DETAIL_BALLOT_LABEL, link.title, detailRowsUrl, voteId, DETAIL_BALLOT_LABEL, detailRowsUrl)
      }
      if (!existingVote?.inverted) {
        for (const s of partySummaries) {
          db.prepare(`
            INSERT INTO vote_party_summaries (vote_id, party, position, members, yes, no, abstain, absent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(vote_id, party) DO UPDATE SET
              position = excluded.position,
              members = excluded.members,
              yes = excluded.yes,
              no = excluded.no,
              abstain = excluded.abstain,
              absent = excluded.absent
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
            VALUES (?, ?, ?, ?, ?)
          `).run(voteId, memberId, row.party, row.state ?? stateByMember.get(memberId) ?? '', choice(row))
          memberVotesWritten++
        }
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
    const res = await fetch(`${AW_API}/candidacies-mandates?parliament_period=${AW_PERIOD_ID}&type=mandate&range_start=${start}&range_end=${size}`, { headers: { 'User-Agent': AW_UA, Accept: 'application/json' } })
    if (!res.ok) throw new Error(`AW mandates ${res.status}: ${await res.text()}`)
    const json = (await res.json()) as AwMandatesResponse
    out.push(...json.data)
    if (json.data.length < size) return out
    start += size
  }
}

async function fetchVoteLinks() {
  const linksByKey = new Map<string, LinkItem>()
  const detailsByKey = new Map<string, DetailItem[]>()
  const detailsByDate = new Map<string, DetailItem[]>()
  const detailsByXlsxUrl = new Map<string, DetailItem>()
  const details = await fetchVoteDetails()
  for (const detail of details) {
    const key = detailKey(detail)
    detailsByKey.set(key, [...(detailsByKey.get(key) ?? []), detail])
    detailsByDate.set(detail.date, [...(detailsByDate.get(detail.date) ?? []), detail])
  }
  for (let offset = 0; ; offset += 30) {
    const html = await fetchBundestag(`${LIST_URL}?offset=${offset}&limit=30`).then((r) => r.text())
    const hits = Number(html.match(/data-hits="(\d+)"/)?.[1] ?? 0)
    for (const row of html.matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
      const body = row[1]
      const xlsxUrl = body.match(/href="([^"]+_xls\.xlsx)"/)?.[1]
      if (!xlsxUrl) continue
      const pdfUrl = body.match(/href="([^"]+\.pdf)"/)?.[1] ?? null
      const label = text(body.match(/<strong>\s*([\s\S]*?)\s*<\/strong>/)?.[1] ?? '')
      const publicationDate = parseDate(text(body.match(/data-th="Veröffentlichung"[\s\S]*?<p>\s*([\s\S]*?)\s*<\/p>/)?.[1] ?? ''))
      const date = publicationDate ?? parseDate(label.match(/^(\d{2}\.\d{2}\.\d{4,5})/)?.[1] ?? '')
      const title = label.replace(/^\d{2}\.\d{2}\.\d{4,5}:\s*/, '').trim()
      const matches = date && title ? detailsByKey.get(detailKey({ date, title })) : null
      const detail = detailsByXlsxUrl.get(xlsxUrl) ?? matches?.shift() ?? (date && title ? matchDetailByPrefix(detailsByDate.get(date) ?? [], title) : null)
      if (detail) detailsByXlsxUrl.set(xlsxUrl, detail)
      const sourceId = detail?.sourceId ?? (Number(body.match(/abstimmung\?id=(\d+)/)?.[1] ?? 0) || null)
      const sourceUrl = sourceId ? `https://www.bundestag.de/parlament/plenum/abstimmung/abstimmung?id=${sourceId}` : xlsxUrl
      if (date && title) linksByKey.set(sourceId ? String(sourceId) : xlsxUrl, { date, title, description: detail?.description ?? null, initiator: detail?.initiator ?? null, pdfUrl, xlsxUrl, sourceUrl, sourceId })
    }
    if (offset + 30 >= hits) break
  }
  for (const detail of details) {
    if (!linksByKey.has(String(detail.sourceId))) linksByKey.set(String(detail.sourceId), {
      date: detail.date,
      title: detail.title,
      description: detail.description,
      initiator: detail.initiator,
      pdfUrl: null,
      xlsxUrl: null,
      sourceUrl: `https://www.bundestag.de/parlament/plenum/abstimmung/abstimmung?id=${detail.sourceId}`,
      sourceId: detail.sourceId,
    })
  }
  return [...linksByKey.values()]
}

function matchDetailByPrefix(details: DetailItem[], title: string) {
  const key = titleKey(title)
  return details.find((detail) => {
    const detailTitle = titleKey(detail.title)
    return Math.min(key.length, detailTitle.length) >= 16 && (key.startsWith(detailTitle) || detailTitle.startsWith(key))
  }) ?? null
}

function deleteFallbackVote(link: LinkItem, generatedVoteId: string) {
  const key = titleKey(link.title)
  const fallback = (db.prepare(`
    SELECT id, title, clean_title AS cleanTitle
    FROM votes
    WHERE term_id = ?
      AND vote_type = 'namentlich'
      AND bundestag_id IS NULL
      AND date = ?
  `).all(TERM_ID, link.date) as ExistingVote[]).find((vote) => titleKey(vote.cleanTitle ?? vote.title) === key)
  if (!fallback || fallback.id === generatedVoteId) return
  db.transaction(() => {
    db.prepare('DELETE FROM vote_document_roles WHERE vote_id = ?').run(fallback.id)
    db.prepare('DELETE FROM vote_documents WHERE vote_id = ?').run(fallback.id)
    db.prepare('DELETE FROM vote_members WHERE vote_id = ?').run(fallback.id)
    db.prepare('DELETE FROM vote_party_summary_decisions WHERE vote_id = ?').run(fallback.id)
    db.prepare('DELETE FROM vote_party_summary_translations WHERE vote_id = ?').run(fallback.id)
    db.prepare('DELETE FROM vote_party_summaries WHERE vote_id = ?').run(fallback.id)
    db.prepare('DELETE FROM vote_translations WHERE vote_id = ?').run(fallback.id)
    db.prepare('DELETE FROM vote_description_decisions WHERE vote_id = ?').run(fallback.id)
    db.prepare('DELETE FROM vote_polarity_decisions WHERE vote_id = ?').run(fallback.id)
    db.prepare('DELETE FROM vote_summary_repairs WHERE vote_id = ?').run(fallback.id)
    db.prepare('DELETE FROM vote_antraege WHERE vote_id = ?').run(fallback.id)
    db.prepare('DELETE FROM vote_debate_groups WHERE vote_id = ?').run(fallback.id)
    db.prepare('DELETE FROM speech_vote_links WHERE vote_id = ?').run(fallback.id)
    db.prepare('UPDATE speeches SET vote_id = NULL WHERE vote_id = ?').run(fallback.id)
    db.prepare('UPDATE antrag_descriptions SET source_vote_id = NULL WHERE source_vote_id = ?').run(fallback.id)
    db.prepare('DELETE FROM votes WHERE id = ?').run(fallback.id)
  })()
}

async function fetchVoteDetails() {
  const out: DetailItem[] = []
  for (let offset = 0; ; offset += 10) {
    const html = await fetchBundestag(`${DETAIL_LIST_URL}?offset=${offset}&limit=10`).then((r) => r.text())
    const hits = Number(html.match(/data-hits="(\d+)"/)?.[1] ?? 0)
    for (const slide of html.matchAll(/<div class="col-xs-12 bt-slide">([\s\S]*?)(?=<div class="col-xs-12 bt-slide">|$)/g)) {
      const body = slide[1]
      const sourceId = Number(body.match(/canvas-na-(\d+)/)?.[1] ?? 0)
      const date = parseDate(text(body.match(/<span class="bt-date">\s*([\s\S]*?)\s*<\/span>/)?.[1] ?? ''))
      const headings = [...body.matchAll(/<h3>\s*([\s\S]*?)\s*<\/h3>/g)]
      const heading = headings.at(-1)?.[1]?.replace(/<span class="bt-dachzeile">[\s\S]*?<\/span>/, '') ?? ''
      const title = text(heading)
      const description = text(body.match(/<div class="bt-teaser-haupttext">\s*([\s\S]*?)\s*<\/div>/)?.[1] ?? '')
      const initiatorMatch = description.match(/Fraktion(?:en)?\s+(?:der\s+|des\s+)?([^()]+?)(?:[:,(]|$|\s+(?:zu|zum|zur|Entwurf|Drucksache))/i)
      const initiator = (initiatorMatch ? normalizeFractionLabel(initiatorMatch[1]) : null)
        ?? (/(?:Antrag|Gesetzentwurf)(?:e?s)?\s+der\s+Bundesregierung/i.test(description) ? 'Bundesregierung' : null)
        ?? (/(?:Antrag|Gesetzentwurf)(?:e?s)?\s+des\s+Bundesrates/i.test(description) ? 'Bundesrat' : null)
        ?? normalizeFractionLabel(description)
      if (sourceId && date && title) out.push({ sourceId, date, title, description, initiator })
    }
    if (offset + 10 >= hits) return out
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
    state: null,
    last: String(r[4] ?? '').trim(),
    first: String(r[5] ?? '').trim(),
    yes: Number(r[7] ?? 0),
    no: Number(r[8] ?? 0),
    abstain: Number(r[9] ?? 0),
    absent: Number(r[11] ?? 0),
  })).filter((r) => r.term === TERM_ID && r.party && r.last && r.first)
}

async function fetchDetailVoteRows(sourceId: number): Promise<VoteRow[]> {
  const url = `${DETAIL_ROWS_URL}?id=${sourceId}&ajax=true`
  const res = await fetchBundestag(url)
  if (!res.ok) throw new Error(`detail ballots ${res.status}: ${url}`)
  const html = await res.text()
  const rows = parseDetailBallots(html).map((row) => ({ ...row, party: normalizeParty(row.party), state: row.state || null, session: null, number: null }))
  if (rows.length === 0 || rows.some((row) => !row.party || !row.last || !row.first)) throw new Error(`detail ballots missing: ${url}`)
  const expected = html.match(/data-chart-values="([\d,]+)"/)?.[1]
  const counts = countRows(rows)
  if (expected && expected !== [counts.yes, counts.no, counts.abstain, counts.absent].join(',')) throw new Error(`detail ballot totals differ: ${url}`)
  return rows
}

function summaries(rows: VoteRow[]) {
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

function countRows(rows: VoteRow[]) {
  return rows.reduce((a, r) => ({
    total: a.total + 1,
    yes: a.yes + (choice(r) === 'ja' ? 1 : 0),
    no: a.no + (choice(r) === 'nein' ? 1 : 0),
    abstain: a.abstain + (choice(r) === 'enthalten' ? 1 : 0),
    absent: a.absent + (choice(r) === 'nicht_abgegeben' ? 1 : 0),
  }), { total: 0, yes: 0, no: 0, abstain: 0, absent: 0 })
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

function memberKeys(first: string, last: string) {
  const noParensFirst = first.replace(/\([^)]*\)/g, ' ')
  const noParensLast = last.replace(/\([^)]*\)/g, ' ')
  return [
    nameTokens(`${first} ${last}`).join(' '),
    nameTokens(`${noParensFirst} ${noParensLast}`).join(' '),
    [nameTokens(noParensFirst)[0] ?? '', ...nameTokens(noParensLast)].join(' '),
  ]
}

function registerMemberKeys(id: string, first: string, last: string) {
  for (const [level, key] of memberKeys(first, last).entries()) {
    if (!key.trim()) continue
    const ids = keyMaps[level].get(key) ?? []
    if (!ids.includes(id)) keyMaps[level].set(key, [...ids, id])
  }
}

function resolveMemberId(first: string, last: string) {
  const keys = memberKeys(first, last)
  const alias = MEMBER_ALIASES.get(keys[0])
  if (alias) return alias
  for (const [level, key] of keys.entries()) {
    if (!key.trim()) continue
    const ids = keyMaps[level].get(key) ?? []
    if (ids.length === 1) return ids[0]
    if (ids.length > 1) {
      const withMandate = ids.filter((id) => termMemberIds.has(id))
      if (withMandate.length === 1) return withMandate[0]
      if (withMandate.length > 1) throw new Error(`ambiguous member name ${first} ${last}: ${withMandate.join(', ')}`)
    }
  }
  const base = slugify(`${last}-${first.split(/\s+/)[0] ?? first}`)
  let id = base
  let suffix = 2
  while (usedMemberIds.has(id)) {
    id = `${base}-${suffix}`
    suffix++
  }
  registerMemberKeys(id, first, last)
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
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim()
}

function detailKey(item: { date: string; title: string }) {
  return `${item.date}|${titleKey(item.title)}`
}

function titleKey(title: string) {
  return title.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '')
}

async function fetchBundestag(url: string) {
  const res = await fetch(url, { headers: enodiaCookie ? { 'User-Agent': AW_UA, Cookie: enodiaCookie } : { 'User-Agent': AW_UA } })
  if (!res.headers.get('content-type')?.includes('text/html')) return res
  const body = await res.clone().text()
  if (!body.includes('Enodia Verification')) return res
  const envelope = body.match(/window\.chl\s*=\s*"([^"]+)"/)?.[1]
  if (!envelope) return res
  const challenge = JSON.parse(Buffer.from(envelope.split('.')[0], 'base64url').toString()).content.challenge as string
  const key = await fetch('https://www.bundestag.de/.enodia/verify', {
    method: 'POST',
    headers: enodiaCookie ? { 'User-Agent': AW_UA, Cookie: enodiaCookie } : { 'User-Agent': AW_UA },
    body: `${solvePow(challenge)}-${envelope}`,
  }).then((r) => r.text())
  enodiaCookie = `enodia=${key}`
  return await fetch(url, { headers: { 'User-Agent': AW_UA, Cookie: enodiaCookie } })
}

function solvePow(challenge: string) {
  let sol = 0
  while (createHash('sha256').update(`${challenge}${sol}`).digest('hex').slice(0, 4) !== '0000') sol++
  return sol
}

function nameTokens(value: string) {
  return value
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .split(/[^a-z0-9]+/)
    .filter((t) => t && !HONORIFICS.has(t) && !NAME_PARTICLES.has(t))
}

function slugify(input: string) {
  return input.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 96)
}

function arg(name: string) {
  const i = process.argv.indexOf(name)
  return i === -1 ? null : process.argv[i + 1]
}
