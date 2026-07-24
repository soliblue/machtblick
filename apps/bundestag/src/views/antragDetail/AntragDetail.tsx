import { Landmark } from 'lucide-react'
import type { AntragDetail as AntragDetailData } from '@/server/antraege'
import { formatDate } from '@/lib/format'
import { SERIF } from '@/lib/fonts'
import { isLaenderInitiative } from '@/lib/bundeslaender'
import { motionStatusBucket } from '@/lib/motionStatus'
import { PARTY_LOGO, partyLabel } from '@/lib/parties'
import { KickerChip } from '@/components/KickerChip'
import { MarkdownInline } from '@/components/MarkdownInline'
import { PartyBadge } from '@/views/votesList/PartyBadge'
import { Stamp } from '@/views/votesList/Stamp'
import { VoteDetailTabs } from '@/views/voteDetail/VoteDetailTabs'
import { useCopy, useLocale } from '@/lib/i18n'
import { AntragSignatoryStrip } from './AntragSignatoryStrip'
import { AntragDetailActions } from './AntragDetailActions'
import { AntragDetailsTab } from './AntragDetailsTab'
import { AntragResultTab } from './AntragResultTab'
import { AntragSpeechesTab } from './AntragSpeechesTab'

export type AntragTab = 'ergebnis' | 'details' | 'reden'
export const ANTRAG_TABS: AntragTab[] = ['ergebnis', 'details', 'reden']

export const isAntragTab = (value: unknown): value is AntragTab => ANTRAG_TABS.includes(value as AntragTab)

type Props = {
  data: AntragDetailData
  activeTab: AntragTab
  onTabChange: (tab: AntragTab) => void
}

export function AntragDetail({ data, activeTab, onTabChange }: Props) {
  const { antrag, signatories, linkedVotes, debate } = data
  const locale = useLocale()
  const t = useCopy()
  const stamp = antrag.beratungsstand === 'Überwiesen'
    ? 'ueberwiesen'
    : antrag.beratungsstand === 'Beschlussempfehlung liegt vor'
      ? 'beschlussempfehlung'
      : motionStatusBucket(antrag.beratungsstand)
  const summary = antrag.summarySimplified ?? antrag.abstract
  const title = antrag.cleanTitle ?? antrag.title
  const laender = isLaenderInitiative(antrag.initiativeFraktion)
  const showLogo = !laender && !!antrag.initiativeFraktion && antrag.initiativeFraktion.split(',').some((p) => PARTY_LOGO[p.trim()])
  const availableTabs: Record<AntragTab, boolean> = {
    ergebnis: linkedVotes.length > 0,
    details: true,
    reden: debate.length > 0,
  }
  const visibleActiveTab = availableTabs[activeTab] ? activeTab : linkedVotes.length > 0 ? 'ergebnis' : 'details'
  return (
    <main className="mx-auto max-w-3xl p-l">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-s">
        <span className="min-w-0 truncate text-s caption">
          {laender
            ? <Landmark size={17} aria-hidden="true" />
            : showLogo
              ? <PartyBadge party={antrag.initiativeFraktion} compact logoSize={17} />
              : antrag.initiativeFraktion
                ? partyLabel(antrag.initiativeFraktion, locale)
                : null}
        </span>
        <Stamp variant={stamp} rotated={false} />
        <AntragDetailActions pdfUrl={antrag.drucksachePdfUrl} documentType={antrag.type} />
      </div>
      <h1 lang={locale} className="mt-m font-display text-xl font-semibold leading-[1.15]" style={{ textWrap: 'pretty' }}>
        {title}
      </h1>
      {antrag.cleanTitle && antrag.cleanTitle !== antrag.title ? (
        <div className="mt-s text-s opacity-l">{t.officialTitle}: {antrag.title}</div>
      ) : null}
      <div className="mt-m flex flex-wrap items-center gap-s text-s">
        <KickerChip>{antrag.type === 'gesetzentwurf' ? t.bill : t.motion}</KickerChip>
        {antrag.introducedDate ? <span className="opacity-l">{formatDate(antrag.introducedDate)}</span> : null}
        {antrag.drucksache ? <span className="opacity-l">Drs. {antrag.drucksache}</span> : null}
      </div>
      {laender ? (
        <div className="mt-s flex items-center gap-s">
          <span className="text-s opacity-l">{t.laenderMotion}</span>
          <PartyBadge party={antrag.initiativeFraktion} />
        </div>
      ) : null}

      {signatories.length > 0 ? (
        <div className="mt-l">
          <AntragSignatoryStrip signatories={signatories} />
        </div>
      ) : null}

      {summary ? (
        <div className={`${signatories.length === 0 ? 'mt-l ' : ''}mb-l`}>
          {antrag.summarySimplified
            ? <p className="text-l leading-[1.45]" style={{ fontFamily: SERIF }}><MarkdownInline>{antrag.summarySimplified}</MarkdownInline></p>
            : <p className="whitespace-pre-line text-l leading-[1.45]" style={{ fontFamily: SERIF }}>{summary}</p>}
        </div>
      ) : null}

      <VoteDetailTabs active={visibleActiveTab} availableTabs={availableTabs} onChange={onTabChange} />
      {ANTRAG_TABS.filter((tab) => availableTabs[tab]).map((tab) => (
        <section key={tab} hidden={tab !== visibleActiveTab}>
          {tab === 'ergebnis'
            ? <AntragResultTab votes={linkedVotes} />
            : tab === 'details'
              ? <AntragDetailsTab antrag={antrag} linkedVotes={linkedVotes} />
              : <AntragSpeechesTab data={data} />}
        </section>
      ))}
    </main>
  )
}
