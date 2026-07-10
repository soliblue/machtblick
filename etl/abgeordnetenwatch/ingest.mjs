import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import { ensureSchema } from '../europarl/schema.mjs'
import { api, apiTotal, apiList } from './client.mjs'
import { fractionSlug, partyDef } from './parties.mjs'

const PARLIAMENTS = {
  by: { awParliamentId: 13, label: 'Bayern' },
  be: { awParliamentId: 2, label: 'Berlin' },
}
const CHOICE = { yes: 'ja', no: 'nein', abstain: 'enthalten', no_show: 'nicht_abgegeben' }
const positionOf = (s) =>
  s.yes > 0 && s.no === 0 && s.abstain === 0
    ? 'yes'
    : s.no > 0 && s.yes === 0 && s.abstain === 0
      ? 'no'
      : s.abstain > 0 && s.yes === 0 && s.no === 0
        ? 'abstain'
        : 'mixed'

const dbPath = process.env.MACHTBLICK_DB ?? fileURLToPath(new URL('../../db/machtblick.sqlite', import.meta.url))
const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
ensureSchema(db)

async function periodsFor(cfg) {
  const parliament = await api(`parliaments/${cfg.awParliamentId}`, { cache: false })
  const current = parliament.data.current_project.id
  const currentCount = await apiTotal(`polls?field_legislature=${current}`)
  const periods = [{ id: current, count: currentCount }]
  if (currentCount < 10) {
    const all = await apiList(`parliament-periods?parliament=${cfg.awParliamentId}&type=legislature`)
    const prev = all
      .filter((p) => p.id !== current && p.start_date_period)
      .sort((a, b) => (a.start_date_period < b.start_date_period ? 1 : -1))[0]
    if (prev) periods.push({ id: prev.id, count: await apiTotal(`polls?field_legislature=${prev.id}`) })
  }
  return periods
}

async function loadParliament(key) {
  const cfg = PARLIAMENTS[key]
  const periods = await periodsFor(cfg)
  console.log(`\n[${key}] ${cfg.label} — periods: ${periods.map((p) => `${p.id}(${p.count})`).join(', ')}`)

  const mandateToPolitician = new Map()
  const members = new Map()
  const registerMandate = (m) => {
    const pid = String(m.politician.id)
    mandateToPolitician.set(String(m.id), pid)
    const memberships = m.fraction_membership ?? []
    const latest = [...memberships].sort((a, b) => (String(a.valid_from ?? '') < String(b.valid_from ?? '') ? -1 : 1)).at(-1)
    const slug = fractionSlug(latest?.fraction?.label)
    if (!members.has(pid)) members.set(pid, { id: pid, name: m.politician.label, party: slug ?? 'fraktionslos' })
    return pid
  }
  const resolveMandate = async (mandateId) => {
    const known = mandateToPolitician.get(mandateId)
    if (known) return known
    const detail = await api(`candidacies-mandates/${mandateId}`)
    return registerMandate(detail.data)
  }
  for (const period of periods) {
    for (const m of await apiList(`candidacies-mandates?parliament_period=${period.id}&type=mandate`)) registerMandate(m)
  }

  const votes = []
  const ballots = []
  const summaries = new Map()
  const partySlugs = new Set()
  for (const period of periods) {
    const polls = await apiList(`polls?field_legislature=${period.id}`)
    for (const poll of polls) {
      const detail = await api(`polls/${poll.id}?related_data=votes`)
      const rawRows = detail.data.related_data?.votes ?? []
      const byPolitician = new Map()
      for (const r of rawRows) {
        const pid = await resolveMandate(String(r.mandate.id))
        const prev = byPolitician.get(pid)
        if (!prev || (prev.r.vote === 'no_show' && r.vote !== 'no_show')) byPolitician.set(pid, { pid, r })
      }
      const rows = [...byPolitician.values()]
      if (rows.length < rawRows.length) console.log(`  deduped ${rawRows.length - rows.length} duplicate ballot(s) on poll ${poll.id}`)
      let yes = 0
      let no = 0
      let abstain = 0
      let absent = 0
      for (const { pid, r } of rows) {
        const choice = CHOICE[r.vote] ?? 'nicht_abgegeben'
        ballots.push([String(poll.id), pid, choice])
        if (choice === 'ja') yes++
        else if (choice === 'nein') no++
        else if (choice === 'enthalten') abstain++
        else absent++
        const slug = fractionSlug(r.fraction?.label) ?? members.get(pid)?.party ?? 'fraktionslos'
        partySlugs.add(slug)
        const skey = `${poll.id} ${slug}`
        let s = summaries.get(skey)
        if (!s) {
          s = { voteId: String(poll.id), party: slug, yes: 0, no: 0, abstain: 0, absent: 0, members: 0 }
          summaries.set(skey, s)
        }
        s.members++
        if (choice === 'ja') s.yes++
        else if (choice === 'nein') s.no++
        else if (choice === 'enthalten') s.abstain++
        else s.absent++
      }
      const total = yes + no + abstain + absent
      const result = poll.field_accepted === true ? 'angenommen' : poll.field_accepted === false ? 'abgelehnt' : yes > no ? 'angenommen' : 'abgelehnt'
      votes.push({
        id: String(poll.id),
        date: poll.field_poll_date,
        title: poll.label,
        titleDe: poll.label,
        result,
        yes,
        no,
        abstain,
        absent,
        totalMembers: total,
        sourceUrl: poll.abgeordnetenwatch_url,
      })
    }
  }

  for (const m of members.values()) partySlugs.add(m.party)
  const memberCount = new Map()
  for (const m of members.values()) memberCount.set(m.party, (memberCount.get(m.party) ?? 0) + 1)

  return { key, members, votes, ballots, summaries, partySlugs, memberCount, periods }
}

const insertParty = db.prepare(
  `INSERT INTO mp_parties (parliament, slug, name, short_name, color, seats, member_count)
   VALUES (@parliament, @slug, @name, @shortName, @color, @seats, @memberCount)`,
)
const insertMember = db.prepare(
  `INSERT INTO mp_members (parliament, id, name, first_name, last_name, party, national_party, country, state, picture_url, picture_license)
   VALUES (@parliament, @id, @name, NULL, NULL, @party, NULL, NULL, NULL, NULL, NULL)`,
)
const insertVote = db.prepare(
  `INSERT INTO mp_votes (parliament, id, date, title, title_de, description, reference, procedure_reference, result, yes, no, abstain, absent, total_members, source_url)
   VALUES (@parliament, @id, @date, @title, @titleDe, NULL, NULL, NULL, @result, @yes, @no, @abstain, @absent, @totalMembers, @sourceUrl)`,
)
const insertBallot = db.prepare(`INSERT INTO mp_member_votes (parliament, vote_id, member_id, choice) VALUES (?, ?, ?, ?)`)
const insertSummary = db.prepare(
  `INSERT INTO mp_vote_party_summaries (parliament, vote_id, party, position, yes, no, abstain, absent, members)
   VALUES (@parliament, @voteId, @party, @position, @yes, @no, @abstain, @absent, @members)`,
)

function write(loaded) {
  const P = loaded.key
  const run = db.transaction(() => {
    for (const t of ['mp_vote_party_summaries', 'mp_member_votes', 'mp_votes', 'mp_members', 'mp_parties'])
      db.prepare(`DELETE FROM ${t} WHERE parliament = ?`).run(P)

    for (const slug of loaded.partySlugs) {
      const def = partyDef(slug)
      if (!def) {
        console.log(`  ⚠ unmapped party slug: ${slug}`)
        continue
      }
      const count = loaded.memberCount.get(slug) ?? 0
      insertParty.run({ parliament: P, slug, name: def.name, shortName: def.shortName, color: def.color, seats: count, memberCount: count })
    }
    for (const m of loaded.members.values()) insertMember.run({ parliament: P, id: m.id, name: m.name, party: m.party })
    for (const v of loaded.votes) insertVote.run({ parliament: P, ...v })
    for (const b of loaded.ballots) insertBallot.run(P, b[0], b[1], b[2])
    for (const s of loaded.summaries.values()) insertSummary.run({ parliament: P, ...s, position: positionOf(s) })
  })
  run()
}

for (const key of Object.keys(PARLIAMENTS)) {
  const loaded = await loadParliament(key)
  write(loaded)
  const n = (t) => db.prepare(`SELECT COUNT(*) c FROM ${t} WHERE parliament = ?`).get(key).c
  console.log(`--- loaded (parliament=${key}) ---`)
  console.log(`  periods:                 ${loaded.periods.map((p) => `${p.id}(${p.count} polls)`).join(', ')}`)
  console.log(`  mp_parties:              ${n('mp_parties')}`)
  console.log(`  mp_members:              ${n('mp_members')}`)
  console.log(`  mp_votes:                ${n('mp_votes')}`)
  console.log(`  mp_member_votes:         ${n('mp_member_votes')}`)
  console.log(`  mp_vote_party_summaries: ${n('mp_vote_party_summaries')}`)
}
db.close()
