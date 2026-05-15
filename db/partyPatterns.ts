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
  for (const [re, party] of PARTY_PATTERNS) {
    if (re.test(text)) return party
  }
  return null
}
