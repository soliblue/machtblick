import type { MemberStats } from '@/hooks/useMemberStats'
import { PieDonut } from './PieDonut'

type Props = { data: MemberStats['party'] }

export function PartyPie({ data }: Props) {
  return <PieDonut data={data} />
}
