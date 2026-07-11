import type { AntragSignatory } from '@/server/antraege'
import { SponsorPile } from '@/views/voteDetail/SponsorPile'
import { useCopy } from '@/lib/i18n'

type Props = {
  signatories: AntragSignatory[]
}

export function AntragSignatoryStrip({ signatories }: Props) {
  const t = useCopy()
  return signatories.length > 0 ? (
    <div className="flex h-[32px] items-center gap-s">
      <span className="text-s opacity-l">{t.broughtBy}</span>
      <SponsorPile signatories={signatories} />
    </div>
  ) : null
}
