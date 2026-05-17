import type { Locale } from './locale'

export const PARTY_ORDER = ['CDU/CSU', 'SPD', 'AfD', 'B90/Grüne', 'Die Linke', 'fraktionslos'] as const

export const PARTY_LABEL: Record<string, string> = {
  'CDU/CSU': 'CDU/CSU',
  SPD: 'SPD',
  AfD: 'AfD',
  'B90/Grüne': 'Grüne',
  'Die Linke': 'Linke',
  fraktionslos: 'Fraktionslos',
  Bundesregierung: 'Bundesregierung',
}

const PARTY_LABEL_EN: Record<string, string> = {
  'CDU/CSU': 'CDU/CSU',
  SPD: 'SPD',
  AfD: 'AfD',
  'B90/Grüne': 'Greens',
  'Die Linke': 'The Left',
  fraktionslos: 'Independent',
  Bundesregierung: 'Government',
}

export const partyLabel = (party: string | null | undefined, locale: Locale = 'de') =>
  party ? (locale === 'en' ? PARTY_LABEL_EN[party] : PARTY_LABEL[party]) ?? party : ''

export const PARTY_LOGO: Record<string, string> = {
  'CDU/CSU': '/parties/cdu-csu.svg',
  SPD: '/parties/spd.svg',
  AfD: '/parties/afd.svg',
  'B90/Grüne': '/parties/gruene.svg',
  'Die Linke': '/parties/linke.svg',
}

export const PARTY_COLOR: Record<string, string> = {
  'CDU/CSU': 'var(--color-gray)',
  SPD: 'var(--color-red)',
  AfD: 'var(--color-blue)',
  'B90/Grüne': 'var(--color-green)',
  'Die Linke': 'var(--color-purple)',
  fraktionslos: 'var(--color-brown)',
  Bundesregierung: 'var(--color-fg)',
}

export const PARTY_SLUG: Record<string, string> = {
  'CDU/CSU': 'cdu-csu',
  SPD: 'spd',
  AfD: 'afd',
  'B90/Grüne': 'gruene',
  'Die Linke': 'linke',
  fraktionslos: 'fraktionslos',
  Bundesregierung: 'bundesregierung',
}

export const SLUG_TO_PARTY: Record<string, string> = Object.fromEntries(
  Object.entries(PARTY_SLUG).map(([k, v]) => [v, k]),
)

export const hasPartyLine = (party: string | null | undefined) =>
  !!party && party !== 'fraktionslos' && party !== 'Bundesregierung'

const PARTY_NORMALIZE: Record<string, string> = {
  'Fraktion der CDU/CSU': 'CDU/CSU',
  'Fraktion der SPD': 'SPD',
  'Fraktion der AfD': 'AfD',
  'Fraktion BÜNDNIS 90/DIE GRÜNEN': 'B90/Grüne',
  'Fraktion DIE LINKE': 'Die Linke',
  'Bundesministerium der Finanzen': 'Bundesregierung',
  'Bundesministerium für Wirtschaft und Energie': 'Bundesregierung',
}

export function normalizePartyName(raw: string | null | undefined): string | null {
  return raw ? raw.split(',').map((part) => PARTY_NORMALIZE[part.trim()] ?? part.trim()).filter(Boolean).join(', ') : null
}
