import type { MemberVoteChoice } from '@/server/memberDetail'
import { useCopy } from '@/lib/i18n'

const STYLE: Record<Exclude<MemberVoteChoice, 'nicht_abgegeben'>, { background: string; color: string }> = {
  ja: { background: 'var(--color-success)', color: 'var(--color-background)' },
  nein: { background: 'var(--color-danger)', color: 'var(--color-background)' },
  enthalten: { background: 'var(--color-yellow)', color: 'var(--color-fg)' },
}

type Props = { choice: MemberVoteChoice }

export function VoteChoicePill({ choice }: Props) {
  const t = useCopy()
  return choice === 'nicht_abgegeben' ? (
    <span className="text-s caption opacity-m">{t.absent}</span>
  ) : (
    <span className="w-fit whitespace-nowrap px-s py-[2px] text-[11px] font-semibold caption" style={STYLE[choice]}>
      {{ ja: t.yes, nein: t.no, enthalten: t.abstain }[choice]}
    </span>
  )
}
