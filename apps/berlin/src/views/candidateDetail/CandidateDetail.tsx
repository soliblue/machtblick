import { Link } from '@tanstack/react-router'
import type { CSSProperties } from 'react'
import type { CandidateDetailData } from '@/server/candidate'
import type { CandidateDetailTab } from '@/lib/candidateDetailTabs'
import { candidateStatusLabel } from '@/lib/candidateStatus'
import { CandidateCandidacies } from './CandidateCandidacies'
import { CandidateDetailTabs } from './CandidateDetailTabs'
import { CandidateLinks } from './CandidateLinks'
import { CandidatePortrait } from './CandidatePortrait'
import { CandidatePartyPositions } from './CandidatePartyPositions'
import { CandidatePriorities } from './CandidatePriorities'
import { CandidateProfile } from './CandidateProfile'
import { CandidateSourceNotice } from './CandidateSourceNotice'
import { SourceList } from '../sources/SourceList'

type Props = {
  data: CandidateDetailData
  activeTab: CandidateDetailTab | null
  availableTabs: CandidateDetailTab[]
  onTabChange: (tab: CandidateDetailTab) => void
}

export function CandidateDetail({ data, activeTab, availableTabs, onTabChange }: Props) {
  return (
    <main
      className="mx-auto min-h-[calc(100svh-110px)] max-w-3xl px-l pb-[64px] pt-l"
      style={{ '--party-color': `var(--color-${data.candidate.partyColor})` } as CSSProperties}
    >
      <header className="grid grid-cols-[112px_minmax(0,1fr)] gap-l desk:grid-cols-[128px_minmax(0,1fr)]">
        <div className="desk:row-span-2">
          <CandidatePortrait
            key={data.candidate.slug}
            name={data.candidate.name}
            imageUrl={data.portrait?.imageUrl ?? null}
            sourceUrl={data.portrait?.sourceUrl}
            publisher={data.portrait?.publisher}
            author={data.portrait?.author}
            license={data.portrait?.license}
            licenseUrl={data.portrait?.licenseUrl}
          />
        </div>
        <div className="min-w-0">
          <Link to="/parties/$slug/" params={{ slug: data.party.slug }} className="inline-flex items-center gap-s text-s caption">
            <span className="size-[10px] rounded-full bg-[var(--party-color)]" />
            <span>{data.party.shortName}</span>
          </Link>
          <h1 className="mt-xs font-display text-xxl font-semibold" style={{ overflowWrap: 'anywhere' }}>{data.candidate.name}</h1>
          {data.profile?.occupation || data.profile?.birthYear ? (
            <div className="mt-s flex flex-col gap-xs text-s caption opacity-l">
              {data.profile.occupation ? <span style={{ overflowWrap: 'anywhere' }}>{data.profile.occupation}</span> : null}
              {data.profile.birthYear ? <span>Jahrgang {data.profile.birthYear}</span> : null}
            </div>
          ) : null}
        </div>
        <CandidateCandidacies candidacies={data.candidacies} />
      </header>
      <CandidateSourceNotice {...data.originalSource} />
      <CandidateDetailTabs activeTab={activeTab} tabs={availableTabs} onChange={onTabChange} />
      {availableTabs.includes('biografie') ? (
        <section id="candidate-panel-biografie" aria-labelledby="candidate-tab-biografie" hidden={activeTab !== 'biografie'}>
          <CandidateProfile profile={data.profile} />
        </section>
      ) : null}
      {availableTabs.includes('persoenlich') ? (
        <section id="candidate-panel-persoenlich" aria-labelledby="candidate-tab-persoenlich" hidden={activeTab !== 'persoenlich'}>
          <CandidatePriorities profile={data.profile} />
        </section>
      ) : null}
      {availableTabs.includes('partei') ? (
        <section id="candidate-panel-partei" aria-labelledby="candidate-tab-partei" hidden={activeTab !== 'partei'}>
          <CandidatePartyPositions data={data} />
        </section>
      ) : null}
      <CandidateLinks links={data.links} />
      <div className="mt-xl">
        <SourceList sources={data.sources} label={`Belege, ${candidateStatusLabel[data.candidate.sourceStatus]}`} divided={false} />
      </div>
    </main>
  )
}
