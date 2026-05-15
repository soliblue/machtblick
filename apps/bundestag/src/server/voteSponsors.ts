import { createServerFn } from '@tanstack/react-start'
import { db } from '@machtblick/db/client'
import { voteAntraege, antraege, antragSignatories, members, votes } from '@machtblick/db/schema'
import { eq, inArray } from 'drizzle-orm'
import { loadAffiliationsByMember, partyAt } from './memberParty'

export type VoteSponsorMember = {
  memberId: string
  displayName: string
  partyAtDate: string | null
  portraitUrl: string | null
}

export type VoteSponsorAntrag = {
  antragId: number
  type: 'antrag' | 'gesetzentwurf'
  title: string
  drucksache: string | null
  signatories: VoteSponsorMember[]
}

export type VoteSponsors = { antraege: VoteSponsorAntrag[] }

export const getVoteSponsors = createServerFn({ method: 'GET' })
  .inputValidator((voteId: string) => voteId)
  .handler(async ({ data: voteId }): Promise<VoteSponsors> => {
    const empty: VoteSponsors = { antraege: [] }
    const vote = db.select({ date: votes.date }).from(votes).where(eq(votes.id, voteId)).get()
    if (!vote) return empty
    const links = db
      .select({ antragId: voteAntraege.antragId })
      .from(voteAntraege)
      .where(eq(voteAntraege.voteId, voteId))
      .all()
    const antragIds = links.map((l) => l.antragId)
    if (!antragIds.length) return empty
    const antragRows = db
      .select({
        id: antraege.id,
        type: antraege.type,
        title: antraege.title,
        drucksache: antraege.drucksache,
      })
      .from(antraege)
      .where(inArray(antraege.id, antragIds))
      .orderBy(antraege.id)
      .all()
    const sigRows = db
      .select({
        antragId: antragSignatories.antragId,
        memberId: antragSignatories.memberId,
        firstName: members.firstName,
        lastName: members.lastName,
        pictureUrl: members.pictureUrl,
      })
      .from(antragSignatories)
      .innerJoin(members, eq(antragSignatories.memberId, members.id))
      .where(inArray(antragSignatories.antragId, antragIds))
      .all()
    const affByMember = loadAffiliationsByMember()
    type Row = (typeof sigRows)[number]
    const byAntrag = new Map<number, Row[]>()
    for (const r of sigRows) {
      const arr = byAntrag.get(r.antragId) ?? []
      arr.push(r)
      byAntrag.set(r.antragId, arr)
    }
    const result: VoteSponsorAntrag[] = antragRows.map((a) => {
      const rows = (byAntrag.get(a.id) ?? []).sort(
        (x, y) => x.lastName.localeCompare(y.lastName, 'de') || x.firstName.localeCompare(y.firstName, 'de'),
      )
      const signatories: VoteSponsorMember[] = rows.map((r) => ({
        memberId: r.memberId,
        displayName: `${r.firstName} ${r.lastName}`,
        partyAtDate: partyAt(affByMember.get(r.memberId), vote.date) || null,
        portraitUrl: r.pictureUrl ?? null,
      }))
      return {
        antragId: a.id,
        type: a.type,
        title: a.title,
        drucksache: a.drucksache,
        signatories,
      }
    })
    return { antraege: result }
  })
