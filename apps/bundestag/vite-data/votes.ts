import type Database from 'better-sqlite3'

type VoteRow = {
  id: string
  date: string
  title: string
  clean_title: string | null
  topic: string | null
  vote_type: 'namentlich' | 'handzeichen' | 'hammelsprung'
  initiator: string | null
  result: 'angenommen' | 'abgelehnt'
  yes: number | null
  no: number | null
  abstain: number | null
  absent: number | null
  total_members: number | null
  subject: string | null
  summary: string | null
  summary_simplified: string | null
  summary_detail: string | null
  document: string | null
  source_url: string
  inverted: number
  is_petition_bundle: number
  procedure_json: string | null
  context_json: string | null
}

type SummaryRow = {
  vote_id: string
  party: string
  position: 'yes' | 'no' | 'abstain' | 'mixed'
  members: number | null
  yes: number | null
  no: number | null
  abstain: number | null
  absent: number | null
}

type DocumentRow = {
  id: number
  vote_id: string
  label: string
  title: string
  url: string
}

type VoteMemberRow = {
  member_id: string
  choice: string
  name: string
  picture_url: string | null
  state: string
}

type AffiliationRow = {
  member_id: string
  party: string
  valid_from: string
  valid_to: string | null
}

type SpeechRow = {
  id: string
  speaker_name: string
  speaker_member_id: string | null
  speaker_role: string | null
  party: string | null
  position: number
  text_excerpt: string
}

type DescriptionDecisionRow = {
  source_pdf_url: string
}

const SPEECH_PARTY_NORMALIZE: Record<string, string> = {
  'BÜNDNIS 90/DIE GRÜNEN': 'B90/Grüne',
  'DIE LINKE': 'Die Linke',
}

const PARTY_LINE_EXCLUDED = new Set(['fraktionslos', 'Bundesregierung'])

const ANTRAG_FLAVORED = ['Antrag:', 'Gesetzentwurf:', 'Entschließungsantrag:', 'Änderungsantrag:']
const ANTRAG_EXCLUDED = ['Beschlussempfehlung', 'Bericht:', 'Ergänzung', 'Wahlvorschlag', 'Unterrichtung', 'Verordnung']

function pickAntragPdfUrl(docs: DocumentRow[]): string | null {
  const antrag = docs.filter((d) => ANTRAG_FLAVORED.some((p) => d.title.startsWith(p)) && !ANTRAG_EXCLUDED.some((p) => d.title.startsWith(p)))
  if (!antrag.length) return null
  antrag.sort((a, b) => drucksacheRank(a.label) - drucksacheRank(b.label))
  return antrag[0].url
}

function drucksacheRank(label: string): number {
  const m = label.match(/^(\d+)\/(\d+)$/)
  return m ? Number(m[1]) * 1_000_000 + Number(m[2]) : Number.MAX_SAFE_INTEGER
}

function partyAt(affiliations: AffiliationRow[], date: string): string {
  const hit = affiliations.find((a) => a.valid_from <= date && (a.valid_to === null || a.valid_to >= date))
  return hit?.party ?? ''
}

function normalizeSpeechParty(raw: string | null): string | null {
  return raw ? (SPEECH_PARTY_NORMALIZE[raw] ?? raw) : null
}

export function leanVotes(db: Database.Database) {
  const rows = db.prepare(`
    SELECT id, date, title, clean_title, initiator, result, yes, no, abstain, absent, vote_type
    FROM votes WHERE procedural = 0 AND vote_type != 'hammelsprung'
    ORDER BY date DESC, bundestag_id DESC
  `).all() as Array<Pick<VoteRow, 'id' | 'date' | 'title' | 'clean_title' | 'initiator' | 'result' | 'yes' | 'no' | 'abstain' | 'absent' | 'vote_type'>>
  const allSummaries = db.prepare('SELECT vote_id, party, position, members FROM vote_party_summaries').all() as SummaryRow[]
  const seatsByParty = new Map<string, number>()
  const byVote = new Map<string, SummaryRow[]>()
  for (const s of allSummaries) {
    const arr = byVote.get(s.vote_id) ?? []
    arr.push(s)
    byVote.set(s.vote_id, arr)
  }
  for (const r of rows) {
    if (r.vote_type !== 'namentlich') continue
    for (const s of byVote.get(r.id) ?? []) {
      if (s.members && !seatsByParty.has(s.party)) seatsByParty.set(s.party, s.members)
    }
    if (seatsByParty.size >= 6) break
  }
  return rows.map((v) => {
    if (v.vote_type === 'namentlich' && v.yes != null) {
      return {
        id: v.id, title: v.title, cleanTitle: v.clean_title, date: v.date,
        result: v.result, initiator: v.initiator,
        yes: v.yes, no: v.no!, abstain: v.abstain!, absent: v.absent!,
      }
    }
    const summaries = byVote.get(v.id) ?? []
    let yes = 0, no = 0, abstain = 0
    for (const s of summaries) {
      const seats = seatsByParty.get(s.party) ?? 0
      if (s.position === 'yes') yes += seats
      else if (s.position === 'no') no += seats
      else if (s.position === 'abstain') abstain += seats
    }
    return {
      id: v.id, title: v.title, cleanTitle: v.clean_title, date: v.date,
      result: v.result, initiator: v.initiator,
      yes, no, abstain, absent: 0,
    }
  })
}

export function fullVote(db: Database.Database, id: string) {
  const voteRow = db.prepare('SELECT * FROM votes WHERE id = ?').get(id) as VoteRow
  const documents = db.prepare('SELECT * FROM vote_documents WHERE vote_id = ?').all(id) as DocumentRow[]
  const summaryRows = db.prepare('SELECT * FROM vote_party_summaries WHERE vote_id = ?').all(id) as SummaryRow[]
  const seats = latestSeatsByParty(db)
  const partySummaries = summaryRows.map((s) => {
    if (voteRow.vote_type === 'namentlich') {
      return {
        voteId: s.vote_id, party: s.party, position: s.position,
        members: s.members ?? 0, yes: s.yes ?? 0, no: s.no ?? 0, abstain: s.abstain ?? 0, absent: s.absent ?? 0,
      }
    }
    const m = seats.get(s.party) ?? 0
    return {
      voteId: s.vote_id, party: s.party, position: s.position, members: m,
      yes: s.position === 'yes' ? m : 0,
      no: s.position === 'no' ? m : 0,
      abstain: s.position === 'abstain' ? m : 0,
      absent: 0,
    }
  })
  const vote = voteRow.vote_type === 'namentlich'
    ? {
        id: voteRow.id, bundestagId: null as number | null, voteType: voteRow.vote_type, date: voteRow.date,
        agendaItem: null as string | null, title: voteRow.title, cleanTitle: voteRow.clean_title, topic: voteRow.topic,
        subject: voteRow.subject, summary: voteRow.summary, summarySimplified: voteRow.summary_simplified,
        summaryDetail: voteRow.summary_detail, document: voteRow.document, initiator: voteRow.initiator,
        result: voteRow.result, procedural: false, inverted: !!voteRow.inverted, isPetitionBundle: !!voteRow.is_petition_bundle,
        totalMembers: voteRow.total_members ?? 0, yes: voteRow.yes ?? 0, no: voteRow.no ?? 0,
        abstain: voteRow.abstain ?? 0, absent: voteRow.absent ?? 0, sourceUrl: voteRow.source_url,
        contextJson: voteRow.context_json, procedureJson: voteRow.procedure_json, fetchedAt: '',
      }
    : (() => {
        const yes = partySummaries.reduce((a, s) => a + s.yes, 0)
        const no = partySummaries.reduce((a, s) => a + s.no, 0)
        const abstain = partySummaries.reduce((a, s) => a + s.abstain, 0)
        return {
          id: voteRow.id, bundestagId: null as number | null, voteType: voteRow.vote_type, date: voteRow.date,
          agendaItem: null as string | null, title: voteRow.title, cleanTitle: voteRow.clean_title, topic: voteRow.topic,
          subject: voteRow.subject, summary: voteRow.summary, summarySimplified: voteRow.summary_simplified,
          summaryDetail: voteRow.summary_detail, document: voteRow.document, initiator: voteRow.initiator,
          result: voteRow.result, procedural: false, inverted: !!voteRow.inverted, isPetitionBundle: !!voteRow.is_petition_bundle,
          totalMembers: yes + no + abstain, yes, no, abstain, absent: 0, sourceUrl: voteRow.source_url,
          contextJson: voteRow.context_json, procedureJson: voteRow.procedure_json, fetchedAt: '',
        }
      })()
  const rawVmRows = db.prepare(`
    SELECT vm.member_id, vm.choice, m.name, m.picture_url, vm.state
    FROM vote_members vm
    INNER JOIN members m ON m.id = vm.member_id
    WHERE vm.vote_id = ?
  `).all(id) as VoteMemberRow[]
  const affiliations = db.prepare('SELECT member_id, party, valid_from, valid_to FROM member_affiliations').all() as AffiliationRow[]
  const affByMember = new Map<string, AffiliationRow[]>()
  for (const a of affiliations) {
    const arr = affByMember.get(a.member_id) ?? []
    arr.push(a)
    affByMember.set(a.member_id, arr)
  }
  const vmRows = rawVmRows.map((r) => ({ ...r, party: partyAt(affByMember.get(r.member_id) ?? [], voteRow.date) }))
  const majorityByParty = new Map<string, string>()
  for (const s of partySummaries) {
    const choices = [
      ['ja', s.yes],
      ['nein', s.no],
      ['enthalten', s.abstain],
      ['nicht_abgegeben', s.absent],
    ] as const
    majorityByParty.set(s.party, choices.reduce((a, b) => (b[1] > a[1] ? b : a))[0])
  }
  const defectorsByParty = new Map<string, Array<{ id: string; name: string; choice: string; pictureUrl: string | null }>>()
  for (const r of vmRows) {
    if (PARTY_LINE_EXCLUDED.has(r.party) || !r.party) continue
    const maj = majorityByParty.get(r.party)
    if (!maj || r.choice === maj || r.choice === 'nicht_abgegeben') continue
    const arr = defectorsByParty.get(r.party) ?? []
    arr.push({ id: r.member_id, name: r.name, choice: r.choice, pictureUrl: r.picture_url })
    defectorsByParty.set(r.party, arr)
  }
  const defectors = Array.from(defectorsByParty.entries())
    .map(([party, list]) => ({ party, majority: majorityByParty.get(party)!, count: list.length, members: list }))
    .sort((a, b) => b.count - a.count)
  const speechRows = db.prepare(`
    SELECT id, speaker_name, speaker_member_id, speaker_role, party, position, text_excerpt
    FROM speeches WHERE vote_id = ? ORDER BY position ASC
  `).all(id) as SpeechRow[]
  const debate = speechRows.map((r) => ({
    id: r.id,
    speakerName: r.speaker_name,
    speakerMemberId: r.speaker_member_id,
    speakerRole: r.speaker_role,
    party: normalizeSpeechParty(r.party),
    position: r.position,
    excerpt: r.text_excerpt,
  }))
  const descRow = db.prepare('SELECT source_pdf_url FROM vote_description_decisions WHERE vote_id = ?').get(id) as DescriptionDecisionRow | undefined
  const antragPdfUrl = descRow?.source_pdf_url
    ?? pickAntragPdfUrl(documents)
    ?? null
  return {
    vote,
    documents: documents.map((d) => ({
      id: d.id, voteId: d.vote_id, label: d.label, title: d.title, url: d.url,
    })),
    partySummaries,
    proposingParty: vote.initiator,
    defectors,
    memberBallots: vmRows.map((r) => ({ memberId: r.member_id, name: r.name, party: r.party, choice: r.choice })),
    debate,
    antragPdfUrl,
  }
}

function latestSeatsByParty(db: Database.Database): Map<string, number> {
  const out = new Map<string, number>()
  const namentlich = db.prepare(`
    SELECT id FROM votes WHERE vote_type = 'namentlich' ORDER BY date DESC LIMIT 20
  `).all() as Array<{ id: string }>
  for (const v of namentlich) {
    const rows = db.prepare('SELECT party, members FROM vote_party_summaries WHERE vote_id = ?').all(v.id) as Array<{ party: string; members: number | null }>
    for (const r of rows) if (r.members && !out.has(r.party)) out.set(r.party, r.members)
    if (out.size >= 6) break
  }
  return out
}
