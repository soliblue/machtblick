import { matchParty } from './partyPatterns'

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
