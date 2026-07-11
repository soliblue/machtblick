import type { ReactElement } from 'react'
import { Bookmark, BookmarkCheck, Eye, EyeOff } from 'lucide-react'
import type { VoteDetail as VoteDetailData } from '@/server/voteDetail'
import { formatDateLong } from '@/lib/format'
import { partyLabel } from '@/lib/parties'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { PartyBadge } from '@/views/votesList/PartyBadge'
import { Stamp } from '@/views/votesList/Stamp'
import { MarkdownInline } from '@/lib/MarkdownInline'
import { SERIF } from '@/lib/fonts'
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
  isSaved: boolean
  isSeen: boolean
  onToggleSaved: () => void
  onToggleSeen: () => void
}

function voteFactSummary(vote: VoteDetailData['vote'], partySummaries: VoteDetailData['partySummaries'], locale: 'de' | 'en') {
  const date = formatDateLong(vote.date, locale)
  const result = locale === 'en' ? (vote.result === 'angenommen' ? 'adopted' : 'rejected') : vote.result
  if (vote.voteType === 'namentlich') {
    const countWords = locale === 'en'
      ? { yes: 'yes', no: 'no', abstain: 'abstained', absent: 'did not vote' }
      : { yes: 'Ja', no: 'Nein', abstain: 'Enthaltung', absent: 'nicht abgegeben' }
    const byParty = partySummaries
      .map((s) => {
        const counts = ([['yes', s.yes], ['no', s.no], ['abstain', s.abstain], ['absent', s.absent]] as const)
          .filter(([, n]) => n > 0)
          .map(([key, n]) => `${n} ${key === 'abstain' && n > 1 && locale === 'de' ? 'Enthaltungen' : countWords[key]}`)
          .join(', ')
        return counts ? `${partyLabel(s.party, locale)}: ${counts}` : null
      })
      .filter(Boolean)
      .join('; ')
    return locale === 'en'
      ? `Roll-call vote in the German Bundestag on ${date}: ${result} with ${vote.yes} yes votes, ${vote.no} no votes, ${vote.abstain} abstentions and ${vote.absent ?? 0} votes not cast. Result by parliamentary group: ${byParty}.`
      : `Namentliche Abstimmung im Bundestag am ${date}: ${result} mit ${vote.yes} Ja-Stimmen, ${vote.no} Nein-Stimmen, ${vote.abstain} Enthaltungen und ${vote.absent ?? 0} nicht abgegebenen Stimmen. Ergebnis nach Fraktion: ${byParty}.`
  }
  const stanceWords = locale === 'en'
    ? { yes: 'In favor', no: 'Against', abstain: 'Abstained' }
    : { yes: 'Dafür', no: 'Dagegen', abstain: 'Enthalten' }
  const stances = (['yes', 'no', 'abstain'] as const)
    .map((pos) => [pos, partySummaries.filter((s) => s.position === pos).map((s) => partyLabel(s.party, locale))] as const)
    .filter(([, parties]) => parties.length > 0)
    .map(([pos, parties]) => `${stanceWords[pos]}: ${parties.join(', ')}`)
    .join('. ')
  return locale === 'en'
    ? `Vote by show of hands in the German Bundestag on ${date}: ${result}.${stances ? ` ${stances}.` : ''}`
    : `Abstimmung per Handzeichen im Bundestag am ${date}: ${result}.${stances ? ` ${stances}.` : ''}`
}

const TAB_PANELS: Record<VoteTab, (data: VoteDetailData) => ReactElement> = {
  ergebnis: (data) => <ResultTab data={data} />,
  details: (data) => <DetailTab data={data} />,
  reden: (data) => <SpeechesTab data={data} />,
}

export function VoteDetail({ data, activeTab, onTabChange, isSaved, isSeen, onToggleSaved, onToggleSeen }: Props) {
  const { vote, partySummaries, proposingParty, sponsors } = data
  const locale = useLocale()
  const t = useCopy()
  const savedLabel = isSaved ? t.unsaveVote : t.saveVote
  const seenLabel = isSeen ? t.markUnseen : t.markSeen
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
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-s">
        <span className="min-w-0 truncate text-s caption">
          <PartyBadge party={proposingParty} compact logoSize={17} />
        </span>
        <Stamp variant={vote.result} rotated={false} />
        <div className="flex items-center gap-xs justify-self-end">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={savedLabel}
                aria-pressed={isSaved}
                onClick={onToggleSaved}
                className="inline-flex h-[32px] w-[32px] items-center justify-center rounded-m border bg-background opacity-l transition-opacity hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
                style={{ borderColor: 'color-mix(in oklab, var(--color-fg) 15%, transparent)' }}
              >
                {isSaved ? <BookmarkCheck size={17} aria-hidden="true" /> : <Bookmark size={17} aria-hidden="true" />}
              </button>
            </TooltipTrigger>
            <TooltipContent>{savedLabel}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={seenLabel}
                aria-pressed={isSeen}
                onClick={onToggleSeen}
                className="inline-flex h-[32px] w-[32px] items-center justify-center rounded-m border bg-background opacity-l transition-opacity hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
                style={{ borderColor: 'color-mix(in oklab, var(--color-fg) 15%, transparent)' }}
              >
                {isSeen ? <Eye size={17} aria-hidden="true" /> : <EyeOff size={17} aria-hidden="true" />}
              </button>
            </TooltipTrigger>
            <TooltipContent>{seenLabel}</TooltipContent>
          </Tooltip>
        </div>
      </div>
      <h1 lang={locale} className="mt-m font-display text-xl font-semibold leading-[1.15]" style={{ textWrap: 'pretty' }}>
        {vote.cleanTitle}
      </h1>
      {vote.cleanTitle && vote.cleanTitle !== vote.title && (
        <div className="mt-s text-s opacity-l">{t.officialTitle}: {vote.title}</div>
      )}
      {vote.topic && <div className="mt-s text-m opacity-l">{vote.topic}</div>}
      <p className="sr-only">{voteFactSummary(vote, partySummaries, locale)}</p>

      <div className="mt-l">
        <SponsorStrip antraege={sponsors.antraege} />
      </div>

      {(vote.summarySimplified || vote.summary) && (
        <div className="mb-l">
          {vote.summarySimplified
            ? <p className="text-m" style={{ fontFamily: SERIF }}><MarkdownInline>{vote.summarySimplified}</MarkdownInline></p>
            : <p className="text-m" style={{ fontFamily: SERIF }}>{vote.summary}</p>}
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
