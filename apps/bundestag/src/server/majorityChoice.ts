import type { votePartySummaries } from '@machtblick/db/schema'

export function majorityChoice(s: typeof votePartySummaries.$inferSelect): string {
  const c = [
    ['ja', s.yes ?? 0],
    ['nein', s.no ?? 0],
    ['enthalten', s.abstain ?? 0],
    ['nicht_abgegeben', s.absent ?? 0],
  ] as const
  return c.reduce((a, b) => (b[1] > a[1] ? b : a), c[0])[0]
}
