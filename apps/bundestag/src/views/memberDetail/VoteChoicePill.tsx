import type { MemberVoteRow } from '@/server/members'
import { useCopy } from '@/lib/i18n'

const COLOR: Record<MemberVoteRow['choice'], string> = {
  ja: 'var(--color-success)',
  nein: 'var(--color-danger)',
  enthalten: 'var(--color-yellow)',
  nicht_abgegeben: 'color-mix(in oklab, var(--color-fg) 15%, transparent)',
}

type Props = { choice: MemberVoteRow['choice'] }

export function VoteChoicePill({ choice }: Props) {
  const color = COLOR[choice]
  const t = useCopy()
  const label: Record<MemberVoteRow['choice'], string> = {
    ja: t.yes,
    nein: t.no,
    enthalten: t.abstain,
    nicht_abgegeben: '-',
  }
  return (
    <span
      className="px-s py-[2px] text-s font-semibold uppercase"
      style={{ border: `1px solid ${color}`, color, background: 'transparent', letterSpacing: '0.08em' }}
    >
      {label[choice]}
    </span>
  )
}
