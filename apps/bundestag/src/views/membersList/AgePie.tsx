import type { MemberStats } from '@/hooks/useMemberStats'
import type { AgeBucket } from '@/lib/memberFacets'
import { PieDonut } from './PieDonut'

type Props = { data: MemberStats['age'] }

const SLICE_COLOR: Record<AgeBucket, string> = {
  'unter-30': 'color-mix(in oklab, var(--color-fg) 16%, var(--color-background))',
  '30-39': 'color-mix(in oklab, var(--color-fg) 30%, var(--color-background))',
  '40-49': 'color-mix(in oklab, var(--color-fg) 44%, var(--color-background))',
  '50-59': 'color-mix(in oklab, var(--color-fg) 58%, var(--color-background))',
  '60-69': 'color-mix(in oklab, var(--color-fg) 73%, var(--color-background))',
  '70-plus': 'color-mix(in oklab, var(--color-fg) 88%, var(--color-background))',
}

export function AgePie({ data }: Props) {
  return <PieDonut data={data.map((d) => ({ ...d, color: SLICE_COLOR[d.key] }))} />
}
