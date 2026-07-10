export type ParliamentSlug = 'eu' | 'berlin' | 'bayern'
export type ParliamentDbKey = 'eu' | 'be' | 'by'

export type Parliament = {
  slug: ParliamentSlug
  dbKey: ParliamentDbKey
  name: string
  shortName: string
  seatTotal: number
  accentNote: string
}

export const PARLIAMENTS: Parliament[] = [
  { slug: 'eu', dbKey: 'eu', name: 'Europäisches Parlament', shortName: 'EU-Parlament', seatTotal: 720, accentNote: 'Fraktionen des Europäischen Parlaments' },
  { slug: 'berlin', dbKey: 'be', name: 'Abgeordnetenhaus von Berlin', shortName: 'Berlin', seatTotal: 159, accentNote: 'Fraktionen im Abgeordnetenhaus von Berlin' },
  { slug: 'bayern', dbKey: 'by', name: 'Bayerischer Landtag', shortName: 'Bayern', seatTotal: 203, accentNote: 'Fraktionen im Bayerischen Landtag' },
]

export const parliamentBySlug = (slug: string) => PARLIAMENTS.find((p) => p.slug === slug)
export const dbKeyForSlug = (slug: string) => parliamentBySlug(slug)?.dbKey
