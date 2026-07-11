import { useEffect, useRef } from 'react'
import { Search } from 'lucide-react'
import type { SpeechResult } from '@/server/speeches'
import { useCopy, useLocale } from '@/lib/i18n'
import { useMemberSpeeches } from '@/hooks/useMemberSpeeches'
import { useSpeechPeople } from '@/hooks/useSpeechPeople'
import { MemberSpeechGroupRow } from './MemberSpeechGroupRow'
import { MemberDebateDialog } from './MemberDebateDialog'

const ROW_BORDER = 'color-mix(in oklab, var(--color-fg) 15%, transparent)'

type Props = {
  speeches: SpeechResult[]
  memberId: string
  memberParty: string | null
}

export function MemberSpeechesSection({ speeches, memberId, memberParty }: Props) {
  const locale = useLocale()
  const t = useCopy()
  const speechState = useMemberSpeeches(speeches, locale)
  const people = useSpeechPeople()
  const moreRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const button = moreRef.current
    if (!button) return
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && button.click(), { rootMargin: '240px' })
    observer.observe(button)
    return () => observer.disconnect()
  }, [speechState.hasMore, speechState.slice.length])
  return (
    <section>
      <div className="mb-m flex flex-wrap items-center gap-m">
        <div className="relative flex-1 min-w-[12rem]">
          <Search size={14} className="absolute left-s top-1/2 -translate-y-1/2 opacity-l" />
          <input
            type="text"
            value={speechState.query}
            onChange={(e) => speechState.setQuery(e.target.value)}
            placeholder={t.searchSpeeches}
            className="w-full rounded-m border bg-transparent py-xs pl-[1.75rem] pr-s text-m outline-none focus:border-fg"
            style={{ borderColor: ROW_BORDER }}
          />
          {speechState.textsLoading && <div className="mt-xs text-s opacity-l">{t.searchIndexLoading}</div>}
        </div>
      </div>
      {speechState.textsLoading ? (
        <div className="border-t py-m text-m opacity-l" style={{ borderColor: ROW_BORDER }}>{t.searchPreparing}</div>
      ) : speechState.filteredCount === 0 ? (
        <div className="border-t py-m text-m opacity-l" style={{ borderColor: ROW_BORDER }}>{t.noSpeechesFound}</div>
      ) : (
        <div className="flex flex-col">
          {speechState.slice.map((group) => (
            <MemberSpeechGroupRow
              key={group.id}
              group={group}
              terms={speechState.terms}
              preview={speechState.previewFor(group)}
              onOpen={() => speechState.openGroup(group.id)}
            />
          ))}
        </div>
      )}
      {speechState.hasMore && (
        <button ref={moreRef} type="button" onClick={speechState.showMore} className="mt-m w-full py-m text-s font-semibold opacity-l hover:opacity-100">
          {t.showMore}
        </button>
      )}
      {speechState.activeGroup && (
        <MemberDebateDialog
          group={speechState.activeGroup}
          rows={speechState.activeRows}
          loading={speechState.activeLoading}
          query={speechState.query}
          people={people}
          memberId={memberId}
          memberParty={memberParty}
          onClose={speechState.closeGroup}
        />
      )}
    </section>
  )
}
