import type { BerlinCandidate } from '@machtblick/berlin-db/types'

const slugFor = (partySlug: string, name: string) => `${partySlug}-${name.toLocaleLowerCase('de').replaceAll('ß', 'ss').normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`

export const landesliste = (partySlug: string, sourceUrl: string, names: string[]): BerlinCandidate[] => names.map((name, index) => ({
  slug: slugFor(partySlug, name),
  name,
  partySlug,
  partyShortName: '',
  partyColor: '',
  candidacyType: 'landesliste',
  listPosition: index + 1,
  district: null,
  constituency: null,
  sourceStatus: 'party_published',
  sourceUrl
}))

export const bezirksliste = (partySlug: string, district: string, sourceUrl: string, names: string[]): BerlinCandidate[] => names.map((name, index) => ({
  slug: slugFor(partySlug, name),
  name,
  partySlug,
  partyShortName: '',
  partyColor: '',
  candidacyType: 'bezirksliste',
  listPosition: index + 1,
  district,
  constituency: null,
  sourceStatus: 'party_published',
  sourceUrl
}))
