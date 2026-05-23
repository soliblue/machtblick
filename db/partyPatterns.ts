export const PARTY_ALIAS_SEED_ROWS = [
  ['CDU/CSU', 'CDU/CSU'],
  ['Fraktion der CDU/CSU', 'CDU/CSU'],
  ['SPD', 'SPD'],
  ['Fraktion der SPD', 'SPD'],
  ['AfD', 'AfD'],
  ['Fraktion der AfD', 'AfD'],
  ['FDP', 'FDP'],
  ['Fraktion der FDP', 'FDP'],
  ['BSW', 'BSW'],
  ['B90/Grüne', 'B90/Grüne'],
  ['B90/Gruene', 'B90/Grüne'],
  ['BÜNDNIS 90/DIE GRÜNEN', 'B90/Grüne'],
  ['BÜNDNIS 90/ DIE GRÜNEN', 'B90/Grüne'],
  ['Bündnis 90/Die Grünen', 'B90/Grüne'],
  ['Bündnis 90 / Die Grünen', 'B90/Grüne'],
  ['Fraktion BÜNDNIS 90/DIE GRÜNEN', 'B90/Grüne'],
  ['Fraktion BÜNDNIS 90/ DIE GRÜNEN', 'B90/Grüne'],
  ['Fraktion Bündnis 90/Die Grünen', 'B90/Grüne'],
  ['Die Linke', 'Die Linke'],
  ['DIE LINKE', 'Die Linke'],
  ['DIE LINKE.', 'Die Linke'],
  ['Fraktion DIE LINKE', 'Die Linke'],
  ['Fraktion Die Linke', 'Die Linke'],
  ['Bundesregierung', 'Bundesregierung'],
  ['Bundesministerium der Finanzen', 'Bundesregierung'],
  ['Bundesministerium für Wirtschaft und Energie', 'Bundesregierung'],
  ['Bundesrat', 'Bundesrat'],
] as const

const PARTY_ALIASES = new Map<string, string>(PARTY_ALIAS_SEED_ROWS.map(([alias, canonical]) => [key(alias), canonical]))

export const PARTY_PATTERNS: Array<[RegExp, string]> = [
  [/CDU\s*\/\s*CSU/i, 'CDU/CSU'],
  [/B(?:Ü|UE|U)NDNIS\s*90\s*\/\s*DIE\s*GR(?:Ü|UE|U)NEN/i, 'B90/Grüne'],
  [/B(?:ü|u)ndnis\s*90\s*\/\s*Die\s*Gr(?:ü|u)nen/i, 'B90/Grüne'],
  [/B90\s*\/\s*Gr(?:ü|ue|u)ne/i, 'B90/Grüne'],
  [/Die\s*Linke/i, 'Die Linke'],
  [/\bAfD\b/, 'AfD'],
  [/\bSPD\b/, 'SPD'],
  [/\bFDP\b/, 'FDP'],
  [/\bBSW\b/, 'BSW'],
]

export function matchParty(text: string): string | null {
  const alias = PARTY_ALIASES.get(key(text))
  if (alias) return alias
  for (const [re, party] of PARTY_PATTERNS) {
    if (re.test(text)) return party
  }
  return null
}

export function canonicalPartyToken(text: string): string | null {
  const trimmed = text.trim()
  if (!trimmed) return null
  if (/^Bundesministerium\b/i.test(trimmed)) return 'Bundesregierung'
  return matchParty(trimmed)
}

export function normalizePartyList(text: string): string {
  return text.split(',').map((part) => canonicalPartyToken(part) ?? part.trim()).filter(Boolean).join(', ')
}

function key(text: string): string {
  return text.toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}
