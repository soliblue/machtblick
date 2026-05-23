import { initials } from '@/lib/initials'
import { VoteChoicePill } from '../memberDetail/VoteChoicePill'
import { PartyLogo } from '../votesList/PartyLogo'
import type { MemberVoteRow } from '@/server/members'
import { useLocale } from '@/lib/i18n'
import { withLocale } from '@/lib/locale'

const ROW_BORDER = 'color-mix(in oklab, var(--color-fg) 8%, transparent)'

type Props = {
  id: string
  name: string
  choice: MemberVoteRow['choice']
  pictureUrl: string | null
  party: string
}

export function DefectorRow({ id, name, choice, pictureUrl, party }: Props) {
  const locale = useLocale()
  return (
    <a
      href={withLocale(`/members/${id}/votes/`, locale)}
      className="grid grid-cols-[36px_1fr_auto] items-center gap-m border-t py-s opacity-100 hover:bg-surface"
      style={{ borderColor: ROW_BORDER }}
    >
      {pictureUrl ? (
        <img src={pictureUrl} alt={name} className="h-[36px] w-[36px] rounded-full object-cover" />
      ) : (
        <div className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-surface text-s font-semibold opacity-l">
          {initials(name)}
        </div>
      )}
      <div className="flex flex-col items-start gap-xs">
        <div className="text-m">{name}</div>
        <VoteChoicePill choice={choice} />
      </div>
      <PartyLogo party={party} size={36} />
    </a>
  )
}
