import type { AntragListItem } from '@/server/antraege'
import type { AntragTypeFilter } from '@/hooks/useAntragListFilters'
import { MOTION_STATUS_BUCKETS } from '@/hooks/useAntragListFilters'
import type { MotionStatusBucket } from '@/lib/motionStatus'
import { partyLabel } from '@/lib/parties'
import { useCopy, useLocale } from '@/lib/i18n'
import { AntragCard } from './AntragCard'
import { FilterPill } from '@/views/votesList/FilterPill'
import { FilterPillRow } from '@/views/votesList/FilterPillRow'
import { FilterSheet, type FilterSheetGroup } from '@/views/votesList/FilterSheet'
import { Pager } from '@/views/redenSearch/Pager'

const PAGE_SIZE = 8

type Props = {
  items: AntragListItem[]
  type: AntragTypeFilter | null
  onTypeChange: (value: AntragTypeFilter | null) => void
  proposer: string | null
  onProposerChange: (value: string | null) => void
  availableProposers: string[]
  status: MotionStatusBucket | null
  onStatusChange: (value: MotionStatusBucket | null) => void
  page: number
  onPageChange: (p: number) => void
}

export function AntraegeList({ items, type, onTypeChange, proposer, onProposerChange, availableProposers, status, onStatusChange, page, onPageChange }: Props) {
  const t = useCopy()
  const locale = useLocale()
  const typeLabels: Record<AntragTypeFilter, string> = { antrag: t.motion, gesetzentwurf: t.bill }
  const proposerLabel = (o: string) => (o === 'Länder' ? t.laender : o === 'Sonstige' ? t.other : partyLabel(o, locale))
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const slice = items.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)
  const sheetGroups: FilterSheetGroup[] = [
    { key: 'type', label: t.type, options: ['antrag', 'gesetzentwurf'], value: type, onChange: (v) => onTypeChange(v as AntragTypeFilter | null), format: (o) => typeLabels[o as AntragTypeFilter] },
    { key: 'proposer', label: t.proposer, options: availableProposers, value: proposer, onChange: onProposerChange, format: proposerLabel },
    { key: 'status', label: t.status, options: MOTION_STATUS_BUCKETS, value: status, onChange: (v) => onStatusChange(v as MotionStatusBucket | null), format: (o) => t.motionBuckets[o as MotionStatusBucket] },
  ]
  return (
    <>
      <div className="sticky top-[54px] z-20 hidden border-b border-fg/15 bg-background desk:block">
        <div className="px-l py-s desk:mx-auto desk:max-w-3xl">
          <FilterPillRow className="">
            <FilterPill label={t.type} options={['antrag', 'gesetzentwurf']} value={type} onChange={(v) => onTypeChange(v as AntragTypeFilter | null)} formatOption={(o) => typeLabels[o as AntragTypeFilter]} />
            <FilterPill label={t.proposer} options={availableProposers} value={proposer} onChange={onProposerChange} formatOption={proposerLabel} />
            <FilterPill label={t.status} options={MOTION_STATUS_BUCKETS} value={status} onChange={(v) => onStatusChange(v as MotionStatusBucket | null)} formatOption={(o) => t.motionBuckets[o as MotionStatusBucket]} />
          </FilterPillRow>
        </div>
      </div>
      <main className="mx-auto max-w-3xl p-l">
        <h1 className="sr-only">{t.motionsIndexCount}</h1>
        <div className="desk:hidden">
          <FilterSheet groups={sheetGroups} activeCount={[type, proposer, status].filter(Boolean).length} />
        </div>
        <div className="mb-m text-s caption opacity-l">
          {items.length.toLocaleString(locale === 'en' ? 'en-US' : 'de-DE')} {t.motionsIndexCount}
        </div>
        <div className="pt-s">
          {slice.map((a) => <AntragCard key={a.id} antrag={a} />)}
        </div>
        {pageCount > 1 && <Pager page={safePage} pageCount={pageCount} onPage={onPageChange} />}
      </main>
    </>
  )
}
