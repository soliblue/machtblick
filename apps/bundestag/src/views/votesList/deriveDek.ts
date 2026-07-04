import type { VoteListItem } from '@/server/votes'
import type { Locale } from '@/lib/locale'
import { hasPartyLine } from '@/lib/parties'

type Prose = { name: string; plural: boolean; article: string; dative: string }

const DE: Record<string, Prose> = {
  'CDU/CSU': { name: 'Union', plural: false, article: 'Die Union', dative: 'der Union' },
  AfD: { name: 'AfD', plural: false, article: 'Die AfD', dative: 'der AfD' },
  SPD: { name: 'SPD', plural: false, article: 'Die SPD', dative: 'der SPD' },
  'B90/Grüne': { name: 'Grüne', plural: true, article: 'Die Grünen', dative: 'den Grünen' },
  'Die Linke': { name: 'Linke', plural: false, article: 'Die Linke', dative: 'der Linken' },
  BSW: { name: 'BSW', plural: false, article: 'Das BSW', dative: 'dem BSW' },
  FDP: { name: 'FDP', plural: false, article: 'Die FDP', dative: 'der FDP' },
  Bundesregierung: { name: 'Bundesregierung', plural: false, article: 'Die Bundesregierung', dative: 'der Bundesregierung' },
}

const EN: Record<string, Prose> = {
  'CDU/CSU': { name: 'CDU/CSU', plural: false, article: 'The CDU/CSU', dative: 'the CDU/CSU' },
  AfD: { name: 'AfD', plural: false, article: 'The AfD', dative: 'the AfD' },
  SPD: { name: 'SPD', plural: false, article: 'The SPD', dative: 'the SPD' },
  'B90/Grüne': { name: 'Greens', plural: true, article: 'The Greens', dative: 'the Greens' },
  'Die Linke': { name: 'The Left', plural: true, article: 'The Left', dative: 'The Left' },
  BSW: { name: 'BSW', plural: false, article: 'The BSW', dative: 'the BSW' },
  FDP: { name: 'FDP', plural: false, article: 'The FDP', dative: 'the FDP' },
  Bundesregierung: { name: 'Federal Government', plural: false, article: 'The Federal Government', dative: 'the Federal Government' },
}

const prose = (party: string, locale: Locale) =>
  (locale === 'de' ? DE : EN)[party] ?? { name: party, plural: false, article: party, dative: party }

const joinNames = (parties: Prose[], locale: Locale) => {
  const names = parties.map((p) => p.name)
  const and = locale === 'de' ? 'und' : 'and'
  return names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} ${and} ${names[names.length - 1]}`
}

const subject = (parties: Prose[], locale: Locale) => (parties.length === 1 ? parties[0].article : joinNames(parties, locale))

const dePluralVerb = (parties: Prose[]) => parties.length > 1 || parties[0].plural

export function lineParties(partySummaries: VoteListItem['partySummaries']) {
  return partySummaries.filter((p) => hasPartyLine(p.party)).sort((a, b) => b.members - a.members)
}

function deriveDek(vote: Pick<VoteListItem, 'partySummaries'>, locale: Locale): string {
  const ps = lineParties(vote.partySummaries)
  const by = (position: string) => ps.filter((p) => p.position === position).map((p) => prose(p.party, locale))
  const ja = by('yes')
  const nein = by('no')
  const enth = by('abstain')
  const mixed = by('mixed')
  const s: string[] = []
  if (locale === 'de') {
    if (ja.length > 0 && nein.length > 0) s.push(`${subject(ja, locale)} ${dePluralVerb(ja) ? 'stimmen' : 'stimmt'} dafür, ${joinNames(nein, locale)} dagegen.`)
    else if (ja.length > 0) s.push(`${subject(ja, locale)} ${dePluralVerb(ja) ? 'stimmen' : 'stimmt'} geschlossen dafür.`)
    else if (nein.length > 0) s.push(`${subject(nein, locale)} ${dePluralVerb(nein) ? 'stimmen' : 'stimmt'} dagegen.`)
    if (enth.length > 0) s.push(`${subject(enth, locale)} ${dePluralVerb(enth) ? 'enthalten' : 'enthält'} sich.`)
    for (const m of mixed) s.push(`${m.article} stimmt uneinheitlich ab.`)
  } else {
    if (ja.length > 0 && nein.length > 0) s.push(`${subject(ja, locale)} ${dePluralVerb(ja) ? 'vote' : 'votes'} in favor, ${joinNames(nein, locale)} against.`)
    else if (ja.length > 0) s.push(`${subject(ja, locale)} ${dePluralVerb(ja) ? 'vote' : 'votes'} unanimously in favor.`)
    else if (nein.length > 0) s.push(`${subject(nein, locale)} ${dePluralVerb(nein) ? 'vote' : 'votes'} against.`)
    if (enth.length > 0) s.push(`${subject(enth, locale)} ${dePluralVerb(enth) ? 'abstain' : 'abstains'}.`)
    for (const m of mixed) s.push(`${m.article} splits its vote.`)
  }
  return s.join(' ')
}

export function deriveDescription(vote: Pick<VoteListItem, 'partySummaries' | 'proposingParty'>, locale: Locale): string {
  const s = [deriveDek(vote, locale)]
  let best: { party: string; dev: number } | null = null
  for (const p of lineParties(vote.partySummaries)) {
    if (p.position === 'yes' || p.position === 'no' || p.position === 'abstain') {
      const line = p.position === 'yes' ? p.yes : p.position === 'no' ? p.no : p.abstain
      const dev = p.yes + p.no + p.abstain - line
      if (dev >= 3 && (best === null || dev > best.dev)) best = { party: p.party, dev }
    }
  }
  if (best) {
    const w = prose(best.party, locale)
    s.push(locale === 'de'
      ? `Bei ${w.dative} weichen ${best.dev} Abgeordnete von der Fraktionslinie ab.`
      : `${best.dev} ${w.name} members break with the party line.`)
  }
  if (vote.proposingParty && (locale === 'de' ? DE : EN)[vote.proposingParty]) {
    const w = prose(vote.proposingParty, locale)
    s.push(locale === 'de' ? `Eingebracht von ${w.dative}.` : `Introduced by ${w.dative}.`)
  }
  return s.join(' ')
}
