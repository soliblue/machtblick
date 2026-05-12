import { usePartyAnfragenStats } from '@/hooks/usePartyAnfragenStats'
import { AnfragenPanel } from './AnfragenPanel'

type Props = { slug: string }

export function PartyAnfragenSection({ slug }: Props) {
  const { data } = usePartyAnfragenStats(slug)
  return data ? <AnfragenPanel data={data} /> : null
}
