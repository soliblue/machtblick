import type { MemberVoteRow } from '@/server/members'

const LABEL: Record<MemberVoteRow['choice'], string> = {
  ja: 'Ja',
  nein: 'Nein',
  enthalten: 'Enth.',
  nicht_abgegeben: '–',
}

const COLOR: Record<MemberVoteRow['choice'], string> = {
  ja: 'var(--color-success)',
  nein: 'var(--color-danger)',
  enthalten: 'var(--color-yellow)',
  nicht_abgegeben: 'color-mix(in oklab, var(--color-fg) 15%, transparent)',
}

type Props = { choice: MemberVoteRow['choice'] }

export function VoteChoicePill({ choice }: Props) {
  const color = COLOR[choice]
  return (
    <span
      className="px-s py-[2px] text-s font-semibold uppercase"
      style={{ border: `1px solid ${color}`, color, background: 'transparent', letterSpacing: '0.08em' }}
    >
      {LABEL[choice]}
    </span>
  )
}
