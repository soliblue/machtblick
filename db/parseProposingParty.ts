import { matchParty } from './partyPatterns'

export function parseProposingParty(document: string | null): string | null {
  if (!document) return null
  const fraktion = document.match(/Fraktion(?:en)?\s+(?:der\s+|des\s+)?([^()]+?)(?:[:,(]|$|\s+(?:zu|zum|zur|Entwurf|Drucksache))/i)
  if (fraktion) {
    const match = matchParty(fraktion[1])
    if (match) return match
  }
  if (/(?:Antrag|Gesetzentwurf)(?:e?s)?\s+der\s+Bundesregierung/i.test(document)) {
    return 'Bundesregierung'
  }
  if (/(?:Antrag|Gesetzentwurf)(?:e?s)?\s+des\s+Bundesrates/i.test(document)) {
    return 'Bundesrat'
  }
  if (/Initiative:\s*Bundesregierung/i.test(document)) {
    return 'Bundesregierung'
  }
  if (/Initiative:\s*Bundesrat/i.test(document)) {
    return 'Bundesrat'
  }
  if (/Antrags?\s+(?:der|des)\s+Bundesministeriums?/i.test(document)) {
    return 'Bundesregierung'
  }
  if (/\bBReg\b/.test(document)) {
    return 'Bundesregierung'
  }
  if (/Petitionsausschuss/i.test(document)) {
    return 'Petitionsausschuss'
  }
  if (/Wahlprüfungsausschuss/i.test(document)) {
    return 'Wahlprüfungsausschuss'
  }
  return matchParty(document)
}
