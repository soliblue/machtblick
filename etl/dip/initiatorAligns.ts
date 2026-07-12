import { canonicalPartyToken } from '../_shared/parties.ts'

const LAENDER = new Set([
  'baden-württemberg', 'baden-wuerttemberg',
  'bayern',
  'berlin',
  'brandenburg',
  'bremen',
  'hamburg',
  'hessen',
  'mecklenburg-vorpommern',
  'niedersachsen',
  'nordrhein-westfalen',
  'rheinland-pfalz',
  'saarland',
  'sachsen',
  'sachsen-anhalt',
  'schleswig-holstein',
  'thüringen', 'thueringen',
])

function normalizeToken(raw: string): string | null {
  const t = raw.trim()
  if (!t) return null
  if (/^Bundesregierung$/i.test(t)) return 'Bundesregierung'
  if (/^Bundesministerium\b/i.test(t)) return 'Bundesregierung'
  if (/^Bundesrat$/i.test(t)) return 'Bundesrat'
  if (LAENDER.has(t.toLowerCase())) return 'Bundesrat'
  return canonicalPartyToken(t)
}

export function normalizeInitiatorTokens(raw: string | null | undefined): Set<string> {
  const out = new Set<string>()
  if (!raw) return out
  for (const part of raw.split(',')) {
    const token = normalizeToken(part)
    if (token) out.add(token)
  }
  return out
}

export function initiatorAligns(
  voteInitiator: string | null | undefined,
  antragInitiativeFraktion: string | null | undefined,
): { aligns: boolean; reason: 'match' | 'misalign' | 'no_normalization' } {
  const voteSet = normalizeInitiatorTokens(voteInitiator)
  const antragSet = normalizeInitiatorTokens(antragInitiativeFraktion)
  if (voteSet.size === 0 || antragSet.size === 0) {
    return { aligns: false, reason: 'no_normalization' }
  }
  for (const v of voteSet) {
    if (antragSet.has(v)) return { aligns: true, reason: 'match' }
  }
  return { aligns: false, reason: 'misalign' }
}
