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
  Petitionsausschuss: 'Petitionsausschuss',
  Wahlprüfungsausschuss: 'Wahlprüfungsausschuss',
}

const PARTY_LABEL_EN: Record<string, string> = {
  'CDU/CSU': 'CDU/CSU',
  SPD: 'SPD',
  AfD: 'AfD',
  'B90/Grüne': 'Greens',
  'Die Linke': 'The Left',
  fraktionslos: 'Independent',
  Bundesregierung: 'Government',
  Petitionsausschuss: 'Petitions Committee',
  Wahlprüfungsausschuss: 'Election Review Committee',
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
  Petitionsausschuss: 'var(--color-gray)',
  Wahlprüfungsausschuss: 'var(--color-gray)',
}

export const partySurfaceColor = (color: string) =>
  `color-mix(in oklab, ${color} 10%, var(--color-background))`

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

export const DONATION_PARTY_NAMES: Record<string, string[]> = {
  'CDU/CSU': ['CDU', 'CSU'],
  SPD: ['SPD'],
  AfD: ['AfD'],
  'B90/Grüne': ['B90/Grüne'],
  'Die Linke': ['Die Linke'],
}

const GOVERNING_PARTIES = ['CDU/CSU', 'SPD']

export const isGoverning = (party: string) => GOVERNING_PARTIES.includes(party)

export const hasPartyLine = (party: string | null | undefined) =>
  !!party && party !== 'fraktionslos' && party !== 'Bundesregierung' && party !== 'Petitionsausschuss' && party !== 'Wahlprüfungsausschuss'
