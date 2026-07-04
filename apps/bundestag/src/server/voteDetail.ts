import { createServerFn } from '@tanstack/react-start'
import { notFound } from '@tanstack/react-router'
import { db } from '@machtblick/db/client'
import { votes, voteDocuments, votePartySummaries, voteMembers, members, voteDescriptionDecisions } from '@machtblick/db/schema'
import { eq, sql } from 'drizzle-orm'
import { loadAffiliationsByMember, partyAt } from './memberParty'
import { getChamberSize, getSeatsByParty } from './seats'
import { overlayVote, partySummaryTranslationMap, speechTranslationMap, voteTranslationMap } from './translations'
import { hasPartyLine } from '../lib/parties'
import { SHOW_HAMMELSPRUNG } from '../lib/voteTypes'
import type { SpeechSummary } from './speeches'
import { normalizeLocale, type Locale } from '../lib/locale'
import { requireVoteCleanTitle } from '../lib/voteTitles'

export type VoteDebateSource = 'direct' | 'related'

type DebateSpeechRow = {
  id: string
  speaker_name: string
  speaker_member_id: string | null
  speaker_role: string | null
  party: string | null
  date: string
  agenda_item: string | null
  agenda_title: string | null
  debate_group_id: string | null
  contribution_type: string | null
  position: number
  text_excerpt: string
  debate_source: string | null
}

function loadDebateForVote(voteId: string, date: string, locale: Locale): { speeches: SpeechSummary[]; source: VoteDebateSource } {
  const rows = db.all(sql`
    SELECT s.id, s.speaker_name, s.speaker_member_id, s.speaker_role, s.party,
           s.date, s.agenda_item, COALESCE(sdg.title, pai.title) AS agenda_title,
           sdgs.group_id AS debate_group_id,
           sdgs.contribution_type AS contribution_type,
           COALESCE(sdgs.position, s.position) AS position,
           s.text_excerpt,
           vdg.source AS debate_source
    FROM vote_debate_groups vdg
    INNER JOIN speech_debate_group_speeches sdgs ON sdgs.group_id = vdg.group_id
    INNER JOIN speeches s ON s.id = sdgs.speech_id
    LEFT JOIN speech_debate_groups sdg ON sdg.id = sdgs.group_id
    LEFT JOIN plenary_agenda_items pai ON pai.session_id = s.session_id AND pai.date = s.date AND pai.agenda_item = s.agenda_item
    WHERE vdg.vote_id = ${voteId}
    ORDER BY COALESCE(sdg.date, s.date) ASC, COALESCE(sdgs.position, s.position) ASC
  `) as DebateSpeechRow[]
  const translations = speechTranslationMap(rows.map((row) => row.id), locale)
  return {
    speeches: rows.map((row) => ({
      id: row.id,
      speakerName: row.speaker_name,
      speakerMemberId: row.speaker_member_id,
      speakerRole: row.speaker_role,
      party: row.party,
      date: row.date,
      agendaItem: row.agenda_item,
      agendaTitle: row.agenda_title,
      debateGroupId: row.debate_group_id,
      contributionType: row.contribution_type,
      position: row.position,
      excerpt: translations.get(row.id)?.textExcerpt ?? row.text_excerpt,
    })),
    source: rows.some((row) => row.debate_source === 'related' || row.date !== date) ? 'related' : 'direct',
  }
}

export type VoteDetailVote = Omit<typeof votes.$inferSelect, 'cleanTitle'> & { cleanTitle: string; yes: number; no: number; abstain: number; absent: number | null; totalMembers: number }

export type VoteDetail = {
  vote: VoteDetailVote
  documents: Array<typeof voteDocuments.$inferSelect>
  partySummaries: Array<typeof votePartySummaries.$inferSelect & { yes: number; no: number; abstain: number; absent: number; members: number }>
  proposingParty: string | null
  defectors: Array<{ party: string; majority: string; count: number; members: Array<{ id: string; name: string; choice: string; pictureUrl: string | null }> }>
  memberBallots: Array<{ memberId: string; name: string; party: string; choice: string; pictureUrl: string | null }>
  debate: SpeechSummary[]
  debateSource: VoteDebateSource
  antragPdfUrl: string | null
}

function voteDocumentRoleUrl(voteId: string): string | null {
  const row = db.get(sql`
    SELECT vd.url
    FROM vote_document_roles vdr
    INNER JOIN vote_documents vd ON vd.id = vdr.document_id AND vd.vote_id = vdr.vote_id
    WHERE vdr.vote_id = ${voteId}
      AND vdr.role IN ('primary_antrag', 'antrag')
    ORDER BY CASE vdr.role WHEN 'primary_antrag' THEN 0 ELSE 1 END, vd.id
    LIMIT 1
  `) as { url: string } | undefined
  return row?.url ?? null
}

export const getVote = createServerFn({ method: 'GET' })
  .inputValidator((input: string | { id: string; locale?: Locale }) => typeof input === 'string' ? { id: input, locale: 'de' as Locale } : { id: input.id, locale: normalizeLocale(input.locale) })
  .handler(async ({ data }): Promise<VoteDetail> => {
    const { id, locale } = data
    const voteRow = db.select().from(votes).where(eq(votes.id, id)).get()
    if (!voteRow) throw notFound()
    if (!SHOW_HAMMELSPRUNG && voteRow.voteType === 'hammelsprung') throw notFound()
    const translations = voteTranslationMap([id], locale)
    const summaryTranslations = partySummaryTranslationMap([id], locale)
    const documents = db.select().from(voteDocuments).where(eq(voteDocuments.voteId, id)).all()
    const summaryRows = db.select().from(votePartySummaries).where(eq(votePartySummaries.voteId, id)).all()
    const seats = getSeatsByParty()
    const partySummaries = summaryRows.map((s) => {
      const t = summaryTranslations.get(`${id} ${s.party}`)
      if (voteRow.voteType === 'namentlich') {
        return { ...s, positionSummary: t?.positionSummary ?? s.positionSummary, keyPoints: t?.keyPoints ?? s.keyPoints, dissentNote: t?.dissentNote ?? s.dissentNote, members: s.members ?? 0, yes: s.yes ?? 0, no: s.no ?? 0, abstain: s.abstain ?? 0, absent: s.absent ?? 0 }
      }
      const m = seats.get(s.party) ?? 0
      return {
        ...s, positionSummary: t?.positionSummary ?? s.positionSummary, keyPoints: t?.keyPoints ?? s.keyPoints, dissentNote: t?.dissentNote ?? s.dissentNote, members: m,
        yes: s.position === 'yes' ? m : 0,
        no: s.position === 'no' ? m : 0,
        abstain: s.position === 'abstain' ? m : 0,
        absent: 0,
      }
    })
    const localizedVote = overlayVote(voteRow, translations)
    const publicVote = requireVoteCleanTitle(localizedVote)
    const vote = voteRow.voteType === 'namentlich'
      ? { ...publicVote, yes: voteRow.yes ?? 0, no: voteRow.no ?? 0, abstain: voteRow.abstain ?? 0, absent: voteRow.absent ?? 0, totalMembers: voteRow.totalMembers ?? 0 }
      : (() => {
          const yes = partySummaries.reduce((a, s) => a + s.yes, 0)
          const no = partySummaries.reduce((a, s) => a + s.no, 0)
          const abstain = partySummaries.reduce((a, s) => a + s.abstain, 0)
          return { ...publicVote, yes, no, abstain, absent: null, totalMembers: Math.max(getChamberSize(), yes + no + abstain) }
        })()
    const rawVmRows = db
      .select({
        memberId: voteMembers.memberId,
        choice: voteMembers.choice,
        name: members.name,
        pictureUrl: members.pictureUrl,
      })
      .from(voteMembers)
      .innerJoin(members, eq(members.id, voteMembers.memberId))
      .where(eq(voteMembers.voteId, id))
      .all()
    const affByMember = loadAffiliationsByMember()
    const vmRows = rawVmRows.map((r) => ({ ...r, party: partyAt(affByMember.get(r.memberId), voteRow.date) }))
    const majorityByParty = new Map<string, string>()
    for (const s of partySummaries) {
      const choices = [
        ['ja', s.yes],
        ['nein', s.no],
        ['enthalten', s.abstain],
        ['nicht_abgegeben', s.absent],
      ] as const
      const top = choices.reduce((a, b) => (b[1] > a[1] ? b : a))
      majorityByParty.set(s.party, top[0])
    }
    const defectorsByParty = new Map<string, Array<{ id: string; name: string; choice: string; pictureUrl: string | null }>>()
    for (const r of vmRows) {
      if (!hasPartyLine(r.party)) continue
      const maj = majorityByParty.get(r.party)
      if (!maj || r.choice === maj || r.choice === 'nicht_abgegeben') continue
      const arr = defectorsByParty.get(r.party) ?? []
      arr.push({ id: r.memberId, name: r.name, choice: r.choice, pictureUrl: r.pictureUrl })
      defectorsByParty.set(r.party, arr)
    }
    const defectors = Array.from(defectorsByParty.entries())
      .map(([party, list]) => ({ party, majority: majorityByParty.get(party)!, count: list.length, members: list }))
      .sort((a, b) => b.count - a.count)
    const debate = loadDebateForVote(voteRow.id, voteRow.date, locale)
    return {
      vote,
      documents,
      partySummaries,
      proposingParty: vote.initiator,
      defectors,
      memberBallots: vmRows.map((r) => ({ memberId: r.memberId, name: r.name, party: r.party, choice: r.choice, pictureUrl: r.pictureUrl })),
      debate: debate.speeches,
      debateSource: debate.source,
      antragPdfUrl: db.select({ url: voteDescriptionDecisions.sourcePdfUrl }).from(voteDescriptionDecisions).where(eq(voteDescriptionDecisions.voteId, id)).get()?.url
        ?? voteDocumentRoleUrl(id)
        ?? null,
    }
  })
