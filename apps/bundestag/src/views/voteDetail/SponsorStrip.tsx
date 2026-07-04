import type { VoteSponsors, VoteSponsorAntrag, VoteSponsorMember } from '@/server/voteSponsors'
import { SponsorPile } from './SponsorPile'
import { useCopy } from '@/lib/i18n'

function mergeSignatories(antraege: VoteSponsorAntrag[]): VoteSponsorMember[] {
  const seen = new Set<string>()
  const out: VoteSponsorMember[] = []
  for (const a of antraege) {
    for (const m of a.signatories) {
      if (seen.has(m.memberId)) continue
      seen.add(m.memberId)
      out.push(m)
    }
  }
  return out
}

export function SponsorStrip({ antraege }: VoteSponsors) {
  const t = useCopy()
  const typeLabel: Record<VoteSponsorAntrag['type'], string> = {
    antrag: t.motion,
    gesetzentwurf: t.bill,
  }
  const withSignatories = antraege.filter((a) => a.signatories.length > 0)
  if (withSignatories.length === 0) return null
  if (withSignatories.length > 3) {
    const merged = mergeSignatories(withSignatories)
    return (
      <div className="mb-l flex h-[32px] items-center gap-s">
        <span className="text-s opacity-l">{t.motionsCount}: {withSignatories.length}</span>
        <SponsorPile signatories={merged} />
      </div>
    )
  }
  if (withSignatories.length === 1) {
    return (
      <div className="mb-l flex h-[32px] items-center gap-s">
        <span className="text-s opacity-l">{t.broughtBy}</span>
        <SponsorPile signatories={withSignatories[0].signatories} />
      </div>
    )
  }
  return (
    <div className="mb-l flex flex-col gap-m">
      {withSignatories.map((a) => (
        <div key={a.antragId} className="flex flex-col gap-xs">
          <div className="text-s opacity-l">
            <span className="caption">{typeLabel[a.type]}</span>
            {a.drucksache && <span className="ml-s">Drs. {a.drucksache}</span>}
          </div>
          <SponsorPile signatories={a.signatories} />
        </div>
      ))}
    </div>
  )
}
