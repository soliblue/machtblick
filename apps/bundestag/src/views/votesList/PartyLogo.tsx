import { PARTY_LABEL, PARTY_LOGO } from '@/lib/parties'

type Props = { party: string; size?: number; decorative?: boolean }

export function PartyLogo({ party, size = 14, decorative = false }: Props) {
  const src = PARTY_LOGO[party]
  if (!src) return null
  const label = PARTY_LABEL[party] ?? party
  return decorative
    ? <img src={src} alt="" style={{ height: size, width: 'auto', flexShrink: 0 }} aria-hidden="true" />
    : <img src={src} alt={`Logo ${label}`} style={{ height: size, width: 'auto', flexShrink: 0 }} />
}
