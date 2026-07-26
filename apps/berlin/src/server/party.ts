import { createServerFn } from '@tanstack/react-start'
import { notFound } from '@tanstack/react-router'
import { readBerlinCatalog, readBerlinProgrammeDetail } from '@machtblick/berlin-db/client'
import type { BerlinCandidateListItem, BerlinParty, BerlinProgrammeDetail } from '@machtblick/berlin-db/types'

export type PartyDetailData = {
  party: BerlinParty
  candidates: BerlinCandidateListItem[]
  programme: BerlinProgrammeDetail | null
}

export const getBerlinParty = createServerFn({ method: 'GET' })
  .validator((slug: string) => slug)
  .handler(async ({ data }): Promise<PartyDetailData> => {
    const catalog = readBerlinCatalog()
    const party = catalog.parties.find(({ slug }) => slug === data)
    if (!party) throw notFound()
    return {
      party,
      candidates: catalog.candidates.filter(({ partySlug }) => partySlug === data),
      programme: readBerlinProgrammeDetail(data)
    }
  })
