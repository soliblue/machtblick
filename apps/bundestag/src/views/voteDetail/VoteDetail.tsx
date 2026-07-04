import type { ReactElement } from 'react'
import type { VoteDetail as VoteDetailData } from '@/server/voteDetail'
import { formatDate } from '@/lib/format'
import { PartyBadge } from '@/views/votesList/PartyBadge'
import { Stamp } from '@/views/votesList/Stamp'
import { deriveStamps } from '@/views/votesList/deriveStamps'
import { MarkdownInline } from '@/lib/MarkdownInline'
import { VoteDetailTabs } from './VoteDetailTabs'
import { ResultTab } from './ResultTab'
import { DetailTab } from './DetailTab'
import { SpeechesTab } from './SpeechesTab'
import { SponsorStrip } from './SponsorStrip'
import type { VoteSponsors } from '@/server/voteSponsors'
import { useCopy, useLocale } from '@/lib/i18n'

export type VoteTab = 'ergebnis' | 'details' | 'reden'
const VOTE_TABS: VoteTab[] = ['ergebnis', 'details', 'reden']

export const isVoteTab = (v: unknown): v is VoteTab =>
  v === 'ergebnis' || v === 'details' || v === 'reden'

type Props = {
  data: VoteDetailData & { sponsors: VoteSponsors }
  activeTab: VoteTab
  onTabChange: (t: VoteTab) => void
}

const TAB_PANELS: Record<VoteTab, (data: VoteDetailData) => ReactElement> = {
  ergebnis: (data) => <ResultTab data={data} />,
  details: (data) => <DetailTab data={data} />,
  reden: (data) => <SpeechesTab data={data} />,
}

export function VoteDetail({ data, activeTab, onTabChange }: Props) {
  const { vote, partySummaries, proposingParty, sponsors } = data
  const stamps = deriveStamps({ ...vote, partySummaries })
  const locale = useLocale()
  const t = useCopy()
  const availableTabs: Record<VoteTab, boolean> = {
    ergebnis: true,
    details: Boolean(vote.summaryDetail),
    reden: data.debate.length > 0,
  }
  const visibleActiveTab = availableTabs[activeTab] ? activeTab : 'ergebnis'
  return (
    <main className="mx-auto max-w-3xl p-l">
      {vote.inverted && (
        <div className="mb-l bg-surface p-m text-s">
          {locale === 'en'
            ? <>We flipped the sign of this vote so the result is easier to read. The original vote was about <em>rejecting</em> this motion. We show the result as if the motion itself had been voted on directly.</>
            : <>Wir haben das Vorzeichen dieser Abstimmung umgedreht, damit das Ergebnis klar lesbar ist. Im Original ging es um die <em>Ablehnung</em> dieses Antrags. Wir zeigen das Ergebnis so, als wäre direkt über den Antrag abgestimmt worden.</>}
        </div>
      )}
      {vote.isPetitionBundle && (
        <div className="mb-l bg-surface p-m text-s">
          {locale === 'en'
            ? 'This vote bundles several petitions into one overview. Parliament votes on all included committee recommendations together. Accepted means the recommendations were adopted as presented, while the individual petitions may have been handled very differently.'
            : 'Diese Abstimmung bündelt mehrere Petitionen in einer Sammelübersicht. Das Plenum stimmt über alle enthaltenen Empfehlungen des Petitionsausschusses gemeinsam ab. Ein "angenommen" bedeutet, dass die Empfehlungen so beschlossen wurden, die einzelnen Petitionen können dabei sehr unterschiedlich behandelt worden sein (z.B. an die Bundesregierung weitergeleitet, als Material überwiesen, oder abschließend behandelt).'}
        </div>
      )}
      <h1 className="text-xxl font-semibold">{vote.cleanTitle}</h1>
      {vote.cleanTitle && vote.cleanTitle !== vote.title && (
        <div className="mt-s text-s opacity-l">{t.officialTitle}: {vote.title}</div>
      )}
      <div className="mt-s flex items-center gap-m text-m">
        <PartyBadge party={proposingParty} />
        <span className="opacity-l">{formatDate(vote.date)}</span>
        {vote.topic && <span className="opacity-l">· {vote.topic}</span>}
      </div>
      <div className="mt-m mb-l flex flex-wrap items-center gap-l">
        {stamps.map((s) => (
          <Stamp key={s} variant={s} size="m" />
        ))}
      </div>

      <SponsorStrip antraege={sponsors.antraege} />

      {(vote.summarySimplified || vote.summary) && (
        <div className="mb-l">
          <div className="mb-s text-s caption opacity-l">{t.proposalSummary}</div>
          {vote.summarySimplified
            ? <p className="text-m"><MarkdownInline>{vote.summarySimplified}</MarkdownInline></p>
            : <p className="text-m">{vote.summary}</p>}
        </div>
      )}

      <VoteDetailTabs active={visibleActiveTab} availableTabs={availableTabs} onChange={onTabChange} />
      {VOTE_TABS.filter((tab) => availableTabs[tab]).map((tab) => (
        <section key={tab} hidden={tab !== visibleActiveTab}>
          {TAB_PANELS[tab](data)}
        </section>
      ))}
    </main>
  )
}
