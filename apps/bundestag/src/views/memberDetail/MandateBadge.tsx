import { MapPin, ListOrdered } from 'lucide-react'
import type { MandateType } from '@/server/members'
import { useCopy } from '@/lib/i18n'

type Props = {
  mandateType: MandateType
  listState: string | null
  constituencyNumber: string | null
  constituencyName: string | null
}

export function MandateBadge({ mandateType, listState, constituencyNumber, constituencyName }: Props) {
  const Icon = mandateType === 'direkt' ? MapPin : ListOrdered
  const t = useCopy()
  const label = mandateType === 'direkt'
    ? constituencyName
      ? `${t.mandateLabels.direkt} · ${t.constituency} ${constituencyNumber ?? ''} ${constituencyName}`.trim()
      : t.mandateLabels.direkt
    : listState
      ? `${t.mandateLabels.liste} · ${listState}`
      : t.mandateLabels.liste
  return (
    <span className="inline-flex items-center gap-xs text-s opacity-l">
      <Icon size={14} />
      <span>{label}</span>
    </span>
  )
}
