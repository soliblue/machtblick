import { formatDate } from '@/lib/format'
import { isOffTrackStatus, motionStatusBucket } from '@/lib/motionStatus'
import { useCopy } from '@/lib/i18n'

type Props = {
  type: 'antrag' | 'gesetzentwurf'
  beratungsstand: string | null
  introducedDate: string | null
  vote: { result: 'angenommen' | 'abgelehnt'; date: string } | null
}

type StageState = 'done' | 'pending' | 'success' | 'danger'

const DOT_COLOR: Record<Exclude<StageState, 'pending'>, string> = {
  done: 'var(--color-fg)',
  success: 'var(--color-success)',
  danger: 'var(--color-danger)',
}

export function AntragTimeline({ type, beratungsstand, introducedDate, vote }: Props) {
  const t = useCopy()
  const bucket = motionStatusBucket(beratungsstand)
  const decision = vote?.result ?? (bucket === 'angenommen' ? 'angenommen' : bucket === 'abgelehnt' ? 'abgelehnt' : null)
  const verkuendet = type === 'gesetzentwurf' && beratungsstand === 'Verkündet'
  const committeeReached = bucket !== 'nicht-beraten'
  const stages: Array<{ key: string; label: string; sub: string | null; state: StageState }> = [
    { key: 'eingebracht', label: t.stageIntroduced, sub: introducedDate ? formatDate(introducedDate) : null, state: 'done' },
    { key: 'ausschuss', label: t.stageCommittee, sub: committeeReached ? '✓' : null, state: committeeReached ? 'done' : 'pending' },
    {
      key: 'abstimmung',
      label: t.stageVote,
      sub: decision ? [decision === 'angenommen' ? t.accepted : t.rejected, vote ? formatDate(vote.date).slice(0, 6) : null].filter(Boolean).join(' · ') : null,
      state: decision ? (decision === 'angenommen' ? 'success' : 'danger') : 'pending',
    },
    ...(verkuendet ? [{ key: 'verkuendet', label: t.stageEnacted, sub: null, state: 'success' as StageState }] : []),
  ]
  return (
    <div>
      <ol role="list" aria-label={t.procedure} className="grid auto-cols-fr grid-flow-col grid-rows-[auto_auto_auto]">
        {stages.map((s, i) => (
          <li key={s.key} aria-label={[s.label, s.sub].filter(Boolean).join(', ')} className="row-span-3 grid min-w-0 grid-rows-subgrid">
            <div
              className={`text-s caption ${s.state === 'success' || s.state === 'danger' ? 'font-semibold' : 'opacity-l'} px-xs text-center`}
              style={{ hyphens: 'auto', ...(s.state === 'success' || s.state === 'danger' ? { color: DOT_COLOR[s.state] } : {}) }}
            >
              {s.label}
            </div>
            <div className="mt-xs px-xs text-center text-s opacity-l">{s.sub}</div>
            <div className="mt-xs flex items-center self-end">
              <div className={`h-px flex-1 ${i > 0 ? 'bg-fg/15' : ''}`} />
              {s.state === 'pending' ? (
                <span className="h-[8px] w-[8px] shrink-0 rounded-full border border-fg/15 bg-transparent" />
              ) : (
                <span className="h-[8px] w-[8px] shrink-0 rounded-full" style={{ background: DOT_COLOR[s.state] }} />
              )}
              <div className={`h-px flex-1 ${i < stages.length - 1 ? 'bg-fg/15' : ''}`} />
            </div>
          </li>
        ))}
      </ol>
      {isOffTrackStatus(beratungsstand) && beratungsstand && (
        <p className="mt-s text-s opacity-l">{t.motionStatus[beratungsstand] ?? beratungsstand}</p>
      )}
    </div>
  )
}
