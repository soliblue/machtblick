import { MapPin, ListOrdered } from 'lucide-react'
import type { MandateType } from '@/server/members'

type Props = {
  mandateType: MandateType
  constituencyNumber: string | null
  constituencyName: string | null
}

export function MandateBadge({ mandateType, constituencyNumber, constituencyName }: Props) {
  const Icon = mandateType === 'direkt' ? MapPin : ListOrdered
  const label = mandateType === 'direkt'
    ? constituencyName
      ? `Direktmandat · Wahlkreis ${constituencyNumber ?? ''} ${constituencyName}`.trim()
      : 'Direktmandat'
    : 'Landesliste'
  return (
    <span className="inline-flex items-center gap-xs text-s opacity-l">
      <Icon size={14} />
      <span>{label}</span>
    </span>
  )
}
