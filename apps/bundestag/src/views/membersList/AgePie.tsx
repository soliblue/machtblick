import type { MemberStats } from '@/hooks/useMemberStats'
import type { AgeBucket } from '@/lib/ageBuckets'
import { PieDonut } from './PieDonut'

type Props = { data: MemberStats['age'] }

const SLICE_COLOR: Record<AgeBucket, string> = {
  'unter-30': 'var(--color-cyan)',
  '30-39': 'var(--color-teal)',
  '40-49': 'var(--color-mint)',
  '50-59': 'var(--color-yellow)',
  '60-69': 'var(--color-orange)',
  '70-plus': 'var(--color-rust)',
}

export function AgePie({ data }: Props) {
  const colored = data.map((d) => ({ ...d, color: SLICE_COLOR[d.key] }))
  return <PieDonut data={colored} />
}
