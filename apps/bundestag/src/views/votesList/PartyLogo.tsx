import { PARTY_LOGO } from '@/lib/parties'

type Props = { party: string; size?: number }

export function PartyLogo({ party, size = 14 }: Props) {
  const src = PARTY_LOGO[party]
  if (!src) return null
  return <img src={src} alt="" style={{ height: size, width: 'auto', flexShrink: 0 }} aria-hidden />
}
