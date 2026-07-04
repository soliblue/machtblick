export type MotionStatusBucket = 'angenommen' | 'abgelehnt' | 'im-verfahren' | 'nicht-beraten'

const ACCEPTED_STATES = new Set(['Angenommen', 'Verabschiedet', 'Verkündet', 'Abgeschlossen'])

const OFF_TRACK_STATES = [
  /^Bundesrat/,
  /^Im Vermittlungsverfahren/,
  /^1\. Durchgang im Bundesrat/,
  /^Einbringung/,
  /^Für erledigt erklärt/,
]

export function motionStatusBucket(beratungsstand: string | null): MotionStatusBucket {
  const s = beratungsstand ?? ''
  return ACCEPTED_STATES.has(s) ? 'angenommen'
    : s === 'Abgelehnt' ? 'abgelehnt'
    : s === '' || s.includes('Noch nicht beraten') ? 'nicht-beraten'
    : 'im-verfahren'
}

export function isOffTrackStatus(beratungsstand: string | null): boolean {
  return OFF_TRACK_STATES.some((re) => re.test(beratungsstand ?? ''))
}
