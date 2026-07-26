import { createServerFn } from '@tanstack/react-start'
import { readBerlinCatalog } from '@machtblick/berlin-db/client'
import type { BerlinCandidateListItem, BerlinCatalog, BerlinParty } from '@machtblick/berlin-db/types'
import { resolvePortraitUrl } from './portraitManifest'

export type CandidateItem = BerlinCandidateListItem
export type PartyItem = BerlinParty
export type Catalog = BerlinCatalog

export const getBerlinCatalog = createServerFn({ method: 'GET' }).handler(async (): Promise<Catalog> => {
  const catalog = readBerlinCatalog()
  return {
    ...catalog,
    candidates: catalog.candidates.map((candidate) => ({
      ...candidate,
      portraitUrl: resolvePortraitUrl(candidate.slug, candidate.portraitUrl)
    }))
  }
})
