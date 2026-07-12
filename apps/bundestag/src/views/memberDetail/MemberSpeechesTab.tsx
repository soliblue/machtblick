import { MemberSpeechesSection } from './MemberSpeechesSection'
import { useCopy } from '@/lib/i18n'
import type { getMember } from '@/server/memberDetail'

type Props = { data: Awaited<ReturnType<typeof getMember>> }

export function MemberSpeechesTab({ data }: Props) {
  const t = useCopy()
  const speeches = data?.speeches ?? []
  return speeches.length > 0 ? (
    <MemberSpeechesSection speeches={speeches} memberId={data.id} memberParty={data.party} />
  ) : (
    <div className="rounded-m border p-xl text-center text-m opacity-l" style={{ borderColor: 'color-mix(in oklab, var(--color-fg) 15%, transparent)' }}>
      <div className="font-semibold opacity-100">{t.noSpeechesTerm}</div>
    </div>
  )
}
