const PARTY_PATTERNS: Array<[RegExp, string]> = [
  [/CDU\s*\/\s*CSU/i, 'CDU/CSU'],
  [/B(?:Ü|UE|U)NDNIS\s*90\s*\/\s*DIE\s*GR(?:Ü|UE|U)NEN/i, 'B90/Grüne'],
  [/B(?:ü|u)ndnis\s*90\s*\/\s*Die\s*Gr(?:ü|u)nen/i, 'B90/Grüne'],
  [/Die\s*Linke/i, 'Die Linke'],
  [/\bAfD\b/, 'AfD'],
  [/\bSPD\b/, 'SPD'],
  [/\bFDP\b/, 'FDP'],
  [/\bBSW\b/, 'BSW'],
]

export function parseProposingParty(document: string | null): string | null {
  if (!document) return null
  const fraktion = document.match(/Fraktion(?:en)?\s+(?:der\s+|des\s+)?([^()]+?)(?:[:,(]|$|\s+(?:zu|zum|zur|Entwurf|Drucksache))/i)
  if (fraktion) {
    const match = matchParty(fraktion[1])
    if (match) return match
  }
  if (/(?:Antrag|Gesetzentwurf)(?:es)?\s+der\s+Bundesregierung/i.test(document)) {
    return 'Bundesregierung'
  }
  if (/(?:Antrag|Gesetzentwurf)(?:es)?\s+des\s+Bundesrates/i.test(document)) {
    return 'Bundesrat'
  }
  return matchParty(document)
}

function matchParty(text: string): string | null {
  for (const [re, party] of PARTY_PATTERNS) {
    if (re.test(text)) return party
  }
  return null
}
