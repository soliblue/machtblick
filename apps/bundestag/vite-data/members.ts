import type Database from 'better-sqlite3'

type MemberRow = {
  id: string
  name: string
  first_name: string
  last_name: string
  picture_url: string | null
  picture_author: string | null
  picture_license: string | null
  picture_source_url: string | null
}

type VoteMemberRow = {
  vote_id: string
  member_id: string
  state: string
  choice: string
}

type SummaryRow = {
  vote_id: string
  party: string
  yes: number | null
  no: number | null
  abstain: number | null
  absent: number | null
}

type AffiliationRow = {
  member_id: string
  party: string
  valid_from: string
  valid_to: string | null
}

type VoteRow = {
  id: string
  date: string
  title: string
  clean_title: string | null
  result: 'angenommen' | 'abgelehnt'
}

type SpeechJoinRow = {
  id: string
  speaker_name: string
  speaker_member_id: string | null
  speaker_role: string | null
  party: string | null
  position: number
  text_excerpt: string
  date: string
  vote_id: string | null
  vote_title: string | null
  vote_clean_title: string | null
}

const SPEECH_PARTY_NORMALIZE: Record<string, string> = {
  'BÜNDNIS 90/DIE GRÜNEN': 'B90/Grüne',
  'DIE LINKE': 'Die Linke',
}

const PARTY_LINE_EXCLUDED = new Set(['fraktionslos', 'Bundesregierung'])

function partyAt(affiliations: AffiliationRow[], date: string): string {
  const hit = affiliations.find((a) => a.valid_from <= date && (a.valid_to === null || a.valid_to >= date))
  return hit?.party ?? ''
}

function majorityChoice(s: SummaryRow): string {
  const c = [
    ['ja', s.yes ?? 0],
    ['nein', s.no ?? 0],
    ['enthalten', s.abstain ?? 0],
    ['nicht_abgegeben', s.absent ?? 0],
  ] as const
  return c.reduce((a, b) => (b[1] > a[1] ? b : a), c[0])[0]
}

export function leanMembers(db: Database.Database) {
  const allMembers = db.prepare('SELECT id, name FROM members').all() as Array<Pick<MemberRow, 'id' | 'name'>>
  const nonProceduralVoteIds = new Set(
    (db.prepare("SELECT id FROM votes WHERE procedural = 0").all() as Array<{ id: string }>).map((v) => v.id),
  )
  const vmRows = (db.prepare('SELECT vote_id, member_id, state FROM vote_members').all() as VoteMemberRow[])
    .filter((r) => nonProceduralVoteIds.has(r.vote_id))
  const affiliations = db.prepare('SELECT member_id, party, valid_from, valid_to FROM member_affiliations WHERE valid_to IS NULL').all() as AffiliationRow[]
  const currentParty = new Map(affiliations.map((a) => [a.member_id, a.party]))
  const stateByMember = new Map<string, string>()
  for (const r of vmRows) if (!stateByMember.has(r.member_id)) stateByMember.set(r.member_id, r.state)
  const hasVotes = new Set(vmRows.map((r) => r.member_id))
  return allMembers
    .filter((m) => hasVotes.has(m.id))
    .map((m) => ({
      id: m.id,
      name: m.name,
      party: currentParty.get(m.id) ?? '',
      state: stateByMember.get(m.id) ?? '',
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'))
}

export function fullMember(db: Database.Database, id: string) {
  const m = db.prepare('SELECT * FROM members WHERE id = ?').get(id) as MemberRow
  const vmRows = db.prepare(`
    SELECT vm.vote_id, vm.state, vm.choice, v.date, v.title, v.clean_title, v.result
    FROM vote_members vm
    INNER JOIN votes v ON v.id = vm.vote_id
    WHERE vm.member_id = ? AND v.procedural = 0
    ORDER BY v.date DESC
  `).all(id) as Array<{ vote_id: string; state: string; choice: string; date: string; title: string; clean_title: string | null; result: 'angenommen' | 'abgelehnt' }>
  const affiliations = db.prepare('SELECT member_id, party, valid_from, valid_to FROM member_affiliations WHERE member_id = ?').all(id) as AffiliationRow[]
  const allSummaries = db.prepare('SELECT vote_id, party, yes, no, abstain, absent FROM vote_party_summaries').all() as SummaryRow[]
  const majByVoteParty = new Map<string, string>()
  for (const s of allSummaries) majByVoteParty.set(`${s.vote_id} ${s.party}`, majorityChoice(s))
  let absent = 0
  let loyalMatches = 0
  let loyalEligible = 0
  let defections = 0
  const history = vmRows.map((r) => {
    const party = partyAt(affiliations, r.date)
    const maj = majByVoteParty.get(`${r.vote_id} ${party}`) ?? ''
    const eligible = !!party && !PARTY_LINE_EXCLUDED.has(party)
    const defected = r.choice === 'nicht_abgegeben' ? false : eligible ? r.choice !== maj : null
    if (r.choice === 'nicht_abgegeben') absent++
    else if (eligible) {
      loyalEligible++
      if (r.choice === maj) loyalMatches++
      else defections++
    }
    return {
      voteId: r.vote_id,
      date: r.date,
      title: r.title,
      cleanTitle: r.clean_title,
      result: r.result,
      choice: r.choice,
      party,
      partyMajority: maj,
      defected,
    }
  })
  const currentParty = affiliations.find((a) => a.valid_to === null)?.party ?? ''
  const speechRows = db.prepare(`
    SELECT s.id, s.speaker_name, s.speaker_member_id, s.speaker_role, s.party, s.position,
           s.text_excerpt, s.date, s.vote_id, v.title AS vote_title, v.clean_title AS vote_clean_title
    FROM speeches s
    LEFT JOIN votes v ON v.id = s.vote_id
    WHERE s.speaker_member_id = ?
    ORDER BY s.date DESC, s.position ASC
  `).all(id) as SpeechJoinRow[]
  const speeches = speechRows.map((row) => ({
    id: row.id,
    speakerName: row.speaker_name,
    speakerMemberId: row.speaker_member_id,
    speakerRole: row.speaker_role,
    party: row.party ? (SPEECH_PARTY_NORMALIZE[row.party] ?? row.party) : null,
    position: row.position,
    excerpt: row.text_excerpt,
    date: row.date,
    voteId: row.vote_id,
    voteTitle: row.vote_clean_title ?? row.vote_title,
    snippet: null,
  }))
  return {
    id,
    name: m.name,
    party: currentParty,
    state: vmRows[0]?.state ?? '',
    attendance: vmRows.length ? 1 - absent / vmRows.length : 0,
    loyalty: loyalEligible > 0 ? loyalMatches / loyalEligible : null,
    votesAppeared: vmRows.length,
    defections,
    history,
    speeches,
    pictureUrl: m.picture_url,
    pictureAuthor: m.picture_author,
    pictureLicense: m.picture_license,
    pictureSourceUrl: m.picture_source_url,
  }
}
