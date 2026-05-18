import { Search } from 'lucide-react'
import { Pager } from '@/views/redenSearch/Pager'
import type { SpeechResult } from '@/server/speeches'
import { useCopy, useLocale } from '@/lib/i18n'
import { useMemberSpeeches } from '@/hooks/useMemberSpeeches'
import { MemberSpeechGroupRow } from './MemberSpeechGroupRow'

const ROW_BORDER = 'color-mix(in oklab, var(--color-fg) 15%, transparent)'

export function MemberSpeechesSection({ speeches }: { speeches: SpeechResult[] }) {
  const locale = useLocale()
  const t = useCopy()
  const speechState = useMemberSpeeches(speeches, locale)
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
            className="w-full border bg-transparent py-xs pl-[1.75rem] pr-s text-m outline-none focus:border-fg"
            style={{ borderColor: ROW_BORDER }}
          />
          {speechState.textsLoading && <div className="mt-xs text-s opacity-l">{t.searchIndexLoading}</div>}
        </div>
        <div className="text-s opacity-l">
          {locale === 'en'
            ? `${speechState.filteredCount} speeches, ${speechState.contributionCount} contributions`
            : `${speechState.filteredCount} Reden, ${speechState.contributionCount} Beiträge`}
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
              open={speechState.openIds.has(group.id)}
              onToggle={() => speechState.toggleOpen(group.id)}
              terms={speechState.terms}
              texts={speechState.texts}
              contextRows={speechState.contextRowsFor(group)}
              contextLoading={speechState.contextLoading}
            />
          ))}
        </div>
      )}
      {speechState.pageCount > 1 && <Pager page={speechState.safePage} pageCount={speechState.pageCount} onPage={speechState.setPage} />}
    </section>
  )
}
