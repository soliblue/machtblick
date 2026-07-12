import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Pager } from '@/views/redenSearch/Pager'
import { DebateThread } from '@/views/speeches/DebateThread'
import { Reader, type ReaderItem } from '@/views/speeches/Reader'
import { buildDebateThread } from '@/lib/debateThread'
import { useReader } from '@/hooks/useReader'
import { tokenize } from '@/components/highlight'
import { makeSnippet } from '@/components/snippet'
import { speechTextsLoaded, type SpeechBallotChoice } from '@/lib/speechesStatic'
import { PARTY_ORDER } from '@/lib/parties'
import { useSpeechTexts } from '@/hooks/useSpeechTexts'
import type { MemberVoteRow } from '@/server/memberDetail'
import type { SpeechSummary } from '@/server/speeches'
import { PartySummaryPreviewList, type SummaryRow } from './PartySummaryPreviewList'
import { useCopy, useLocale } from '@/lib/i18n'
import type { AvatarPilePerson } from '@/views/speeches/AvatarPile'

type BallotEntry = { choice: MemberVoteRow['choice']; pictureUrl: string | null }
type Props = { speeches: SpeechSummary[]; source: 'direct' | 'related'; ballotByMember: Map<string, BallotEntry>; partySummaries: SummaryRow[] }

const PAGE_SIZE = 15

export function DebateList({ speeches, source, ballotByMember, partySummaries }: Props) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [fullTextRequested, setFullTextRequested] = useState(false)
  const locale = useLocale()
  const t = useCopy()
  const terms = tokenize(query)
  const texts = useSpeechTexts(locale, terms.length > 0 || fullTextRequested)
  const textsLoading = terms.length > 0 && !speechTextsLoaded(locale)
  const ballotFor = (s: SpeechSummary) => (s.speakerMemberId ? ballotByMember.get(s.speakerMemberId) : undefined)
  const choiceFor = (s: SpeechSummary): SpeechBallotChoice | null => {
    const choice = ballotFor(s)?.choice
    return choice && choice !== 'nicht_abgegeben' ? choice : null
  }
  const filtered = useMemo(() => {
    return speeches.filter((s) => {
      if (!terms.length) return true
      const body = texts.data?.[s.id] ?? s.excerpt
      const hay = `${s.speakerName} ${body}`.toLowerCase()
      return terms.every((t) => hay.includes(t))
    })
  }, [speeches, terms, texts.data])
  const rows = useMemo(
    () => buildDebateThread(filtered.map((s) => ({ ...s, snippet: terms.length ? makeSnippet(texts.data?.[s.id] ?? s.excerpt, terms) : null }))),
    [filtered, terms, texts.data],
  )
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const slice = rows.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)
  const summaries = useMemo(() => {
    const byParty = new Map(partySummaries.filter((s) => s.positionSummary).map((s) => [s.party, s]))
    const ordered = PARTY_ORDER.map((p) => byParty.get(p)).filter((s): s is SummaryRow => Boolean(s))
    const seen = new Set(ordered.map((s) => s.party))
    return [...ordered, ...partySummaries.filter((s) => s.positionSummary && !seen.has(s.party))]
  }, [partySummaries])
  const speakersByParty = useMemo(() => {
    const byParty = new Map<string, AvatarPilePerson[]>()
    const seen = new Map<string, Set<string>>()
    for (const speech of speeches) {
      if (speech.party && speech.speakerMemberId) {
        const partySeen = seen.get(speech.party) ?? new Set<string>()
        if (!partySeen.has(speech.speakerMemberId)) {
          partySeen.add(speech.speakerMemberId)
          seen.set(speech.party, partySeen)
          byParty.set(speech.party, [
            ...(byParty.get(speech.party) ?? []),
            {
              id: speech.speakerMemberId,
              name: speech.speakerName,
              pictureUrl: ballotByMember.get(speech.speakerMemberId)?.pictureUrl ?? null,
            },
          ])
        }
      }
    }
    return byParty
  }, [speeches, ballotByMember])
  const speechItems: ReaderItem[] = rows
    .filter((row) => row.kind === 'turn')
    .map(({ speech }) => ({
      ids: [speech.id],
      speakerName: speech.speakerName,
      speakerMemberId: speech.speakerMemberId,
      speakerRole: speech.speakerRole,
      party: speech.party,
      choice: choiceFor(speech),
      pictureUrl: ballotFor(speech)?.pictureUrl ?? null,
      date: source === 'related' ? speech.date : null,
      voteId: null,
      voteTitle: null,
      fallbackText: texts.data?.[speech.id] ?? speech.excerpt,
    }))
  const speechReader = useReader(speechItems)
  return (
    <section className="mb-l">
      <PartySummaryPreviewList summaries={summaries} speakersByParty={speakersByParty} />
      <div className="mb-s text-s caption opacity-l">
        {source === 'related' ? t.relatedSpeechesForVote : t.debateTimeline}
      </div>
      <div className="mb-m relative min-w-[12rem]">
        <Search size={14} className="absolute left-s top-1/2 -translate-y-1/2 opacity-l" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setPage(0)
          }}
          placeholder={t.searchSpeeches}
          className="w-full rounded-m border bg-transparent py-xs pl-[1.75rem] pr-s text-m outline-none focus:border-fg"
          style={{ borderColor: 'color-mix(in oklab, var(--color-fg) 15%, transparent)' }}
        />
        {textsLoading && <div className="mt-xs text-s opacity-l">{t.searchIndexLoading}</div>}
      </div>
      {textsLoading ? (
        <div className="py-m text-m opacity-l">{t.searchPreparing}</div>
      ) : filtered.length === 0 ? (
        <div className="py-m text-m opacity-l">{t.noSpeechesFound}</div>
      ) : (
        <DebateThread
          rows={slice}
          choiceFor={choiceFor}
          pictureFor={(s) => ballotFor(s)?.pictureUrl ?? null}
          fullTextFor={(s) => texts.data?.[s.id] ?? null}
          fullTextLoading={texts.isFetching}
          onExpandTurn={() => setFullTextRequested(true)}
          query={query}
          onOpenTurn={speechReader.openAt}
        />
      )}
      {pageCount > 1 && <Pager page={safePage} pageCount={pageCount} onPage={setPage} />}
      {speechReader.active && (
        <Reader
          item={speechReader.active}
          index={speechReader.index}
          count={speechReader.count}
          nextName={speechReader.nextItem?.speakerName ?? null}
          query={query}
          onPrev={speechReader.prev}
          onNext={speechReader.next}
          onClose={speechReader.close}
        />
      )}
    </section>
  )
}
