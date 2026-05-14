import type { MemberStats } from '@/hooks/useMemberStats'
import { PieDonut } from './PieDonut'

type Props = { data: MemberStats['gender'] }

const SLICE_COLOR: Record<string, string> = {
  m: 'var(--color-blue)',
  f: 'var(--color-purple)',
  d: 'var(--color-rust)',
  unbekannt: 'color-mix(in oklab, var(--color-fg) 40%, transparent)',
}

export function GenderPie({ data }: Props) {
  const colored = data.map((d) => ({ ...d, color: SLICE_COLOR[d.key] ?? SLICE_COLOR.unbekannt }))
  return <PieDonut data={colored} />
}
