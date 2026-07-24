import type { AntragListItem } from '@/server/antraege'
import type { AntragTypeFilter } from '@/hooks/useAntragListFilters'
import { MOTION_STATUS_BUCKETS, type MotionStatusBucket } from '@/lib/motionStatus'
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
    { key: 'status', label: t.status, options: MOTION_STATUS_BUCKETS, value: status, onChange: (v) => onStatusChange(v as MotionStatusBucket | null), format: (o) => t.motionBuckets[o as MotionStatusBucket] },
    { key: 'type', label: t.type, options: ['antrag', 'gesetzentwurf'], value: type, onChange: (v) => onTypeChange(v as AntragTypeFilter | null), format: (o) => typeLabels[o as AntragTypeFilter] },
    { key: 'proposer', label: t.proposer, options: availableProposers, value: proposer, onChange: onProposerChange, format: proposerLabel },
  ]
  return (
    <>
      <style>{'@media (max-width:699px){html{scroll-snap-type:y mandatory;scroll-padding-top:54px}}@media (max-width:699px) and (max-height:640px){html{scroll-snap-type:none}.motion-snap-card{height:auto}.motion-snap-card>article{min-height:calc(100svh - 98px)}}'}</style>
      <div className="sticky top-[54px] z-20 hidden border-b border-fg/15 bg-background desk:block">
        <div className="px-l py-s desk:mx-auto desk:max-w-3xl">
          <FilterPillRow>
            <FilterPill label={t.status} options={MOTION_STATUS_BUCKETS} value={status} onChange={(v) => onStatusChange(v as MotionStatusBucket | null)} formatOption={(o) => t.motionBuckets[o as MotionStatusBucket]} />
            <FilterPill label={t.type} options={['antrag', 'gesetzentwurf']} value={type} onChange={(v) => onTypeChange(v as AntragTypeFilter | null)} formatOption={(o) => typeLabels[o as AntragTypeFilter]} />
            <FilterPill label={t.proposer} options={availableProposers} value={proposer} onChange={onProposerChange} formatOption={proposerLabel} />
          </FilterPillRow>
        </div>
      </div>
      <h1 className="sr-only">{t.motionsIndexCount}</h1>
      <div className="desk:hidden">
        <FilterSheet groups={sheetGroups} activeCount={[type, proposer, status].filter(Boolean).length} />
      </div>
      <main className="desk:mx-auto desk:flex desk:max-w-3xl desk:flex-col desk:px-l desk:pt-m">
        {slice.map((a, i) => (
          <div
            key={a.id}
            id={`motion-${a.id}`}
            className={`motion-snap-card relative h-[calc(100svh-98px)] snap-start snap-always px-m pt-l desk:h-auto desk:px-0 desk:pb-m desk:pt-m ${i < slice.length - 1 ? 'after:absolute after:inset-x-l after:bottom-0 after:h-px after:bg-elevated' : ''}`}
          >
            <AntragCard antrag={a} />
          </div>
        ))}
        {pageCount > 1 && (
          <div className="snap-start px-l pb-[80px] pt-xl desk:px-0 desk:pb-[64px] desk:pt-0">
            <Pager page={safePage} pageCount={pageCount} onPage={onPageChange} />
          </div>
        )}
      </main>
      {items.length === 0 && <p className="mx-auto max-w-3xl px-l py-xl text-center text-m opacity-l">{t.noData}</p>}
    </>
  )
}
