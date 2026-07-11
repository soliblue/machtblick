import { useId } from 'react'
import type { MemberVoteChoice, MemberVoteRow } from '@/server/memberDetail'
import { useMemberVoteConnector } from '@/hooks/useMemberVoteConnector'
import { useCopy, useLocale } from '@/lib/i18n'
import { withLocale } from '@/lib/locale'
import { PartyBadge } from '@/views/votesList/PartyBadge'
import { PartyDonutRow } from '@/views/votesList/PartyDonutRow'
import { Stamp } from '@/views/votesList/Stamp'

const CHOICE_COLOR: Record<MemberVoteChoice, string> = {
  ja: 'var(--color-success)',
  nein: 'var(--color-danger)',
  enthalten: 'var(--color-yellow)',
  nicht_abgegeben: 'var(--color-fg)',
}

type Props = { vote: MemberVoteRow }

export function MemberVoteCard({ vote }: Props) {
  const locale = useLocale()
  const t = useCopy()
  const markerId = useId().replaceAll(':', '')
  const connector = useMemberVoteConnector()
  const choiceLabels: Record<MemberVoteChoice, string> = {
    ja: t.yes,
    nein: t.no,
    enthalten: t.abstain,
    nicht_abgegeben: t.absent,
  }
  const showsLine = vote.choice !== 'nicht_abgegeben' && vote.defected !== null
  const lineColor = vote.defected ? 'var(--color-danger)' : 'var(--color-success)'
  return (
    <article className="group relative bg-background p-l">
      <a
        href={withLocale(`/votes/${vote.voteId}/`, locale)}
        className="absolute inset-0"
        aria-label={[
          vote.cleanTitle,
          `${t.vote}: ${choiceLabels[vote.choice]}`,
          vote.result === 'angenommen' ? t.accepted : t.rejected,
          ...(showsLine ? [vote.defected ? t.deviation : t.line] : []),
        ].join(' · ')}
      />
      <div className="grid grid-cols-[1fr_auto] items-center gap-s">
        <span className="min-w-0 truncate text-s caption">
          <PartyBadge party={vote.proposingParty} compact logoSize={17} />
        </span>
        <Stamp variant={vote.result} rotated={false} />
      </div>
      <h2
        lang={locale}
        className="mt-m font-display text-xl font-semibold leading-[1.15] decoration-1 underline-offset-[3px] group-hover:underline"
        style={{ hyphens: 'auto', overflowWrap: 'break-word', wordBreak: 'normal', textWrap: 'pretty' }}
      >
        {vote.cleanTitle}
      </h2>
      <div ref={connector.containerRef} className="relative mt-m">
        {vote.partyMajority && connector.geometry ? (
          <svg
            className="pointer-events-none absolute inset-0 z-0 size-full overflow-visible"
            viewBox={`0 0 ${connector.geometry.width} ${connector.geometry.height}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <marker id={markerId} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto" markerUnits="strokeWidth">
                <path d="M 0 0 L 8 4 L 0 8" fill="none" stroke={CHOICE_COLOR[vote.partyMajority]} strokeWidth="1.5" />
              </marker>
            </defs>
            {vote.defected ? (
              <>
                <path
                  d={connector.geometry.path}
                  fill="none"
                  stroke={CHOICE_COLOR[vote.choice]}
                  strokeWidth="1.5"
                  pathLength={100}
                  strokeDasharray="43 57"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
                <path
                  d={connector.geometry.path}
                  fill="none"
                  stroke={CHOICE_COLOR[vote.partyMajority]}
                  strokeWidth="1.5"
                  pathLength={100}
                  strokeDasharray="0 57 43 0"
                  strokeLinecap="round"
                  markerEnd={`url(#${markerId})`}
                  vectorEffect="non-scaling-stroke"
                />
                <path
                  d={connector.geometry.breakPath}
                  fill="none"
                  stroke="var(--color-danger)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </>
            ) : (
              <path
                d={connector.geometry.path}
                fill="none"
                stroke={CHOICE_COLOR[vote.partyMajority]}
                strokeWidth="1.5"
                strokeLinecap="round"
                markerEnd={`url(#${markerId})`}
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>
        ) : null}
        <div
          ref={connector.statusRef}
          className="pointer-events-none relative z-[1] mx-auto flex w-fit max-w-full flex-wrap items-center justify-center gap-s px-s py-xs text-s caption"
        >
          <span className="opacity-l">{t.vote}</span>
          <span
            className="rounded-[var(--radius-s)] px-s py-xs font-semibold"
            style={{
              background: vote.choice === 'nicht_abgegeben' ? 'color-mix(in oklab, var(--color-fg) 12%, transparent)' : CHOICE_COLOR[vote.choice],
              color: vote.choice === 'ja' || vote.choice === 'nein' ? 'var(--color-background)' : 'var(--color-fg)',
            }}
          >
            {choiceLabels[vote.choice]}
          </span>
          {showsLine ? (
            <>
              <span aria-hidden="true" className="opacity-l">·</span>
              <span className="font-semibold uppercase" style={{ color: lineColor }}>{vote.defected ? t.deviation : t.line}</span>
            </>
          ) : null}
        </div>
        {vote.partySummaries.length > 0 ? (
          <div className={`pointer-events-none relative z-[1] ${vote.partyMajority ? 'mt-s' : 'mt-l'}`}>
            <PartyDonutRow
              partySummaries={vote.partySummaries}
              highlight={vote.partyMajority ? {
                party: vote.party,
                color: CHOICE_COLOR[vote.partyMajority],
                targetRef: connector.targetRef,
              } : undefined}
            />
          </div>
        ) : null}
      </div>
    </article>
  )
}
