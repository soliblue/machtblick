import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { PartyDonation } from '@/server/partyDetail'
import { formatDate, formatDateShort } from '@/lib/format'
import { useCopy, useLocale } from '@/lib/i18n'

type Props = { donations: PartyDonation[]; totalEur: number }

const ROW_BORDER = 'color-mix(in oklab, var(--color-fg) 8%, transparent)'

export function DonationsBar({ donations, totalEur }: Props) {
  const sorted = [...donations].sort((a, b) => b.amountEur - a.amountEur)
  const locale = useLocale()
  const t = useCopy()
  const eur = new Intl.NumberFormat(locale === 'de' ? 'de-DE' : 'en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
  return (
    <div>
      <div className="flex items-center justify-between text-s caption opacity-l">
        <span>{t.majorDonations}</span>
        <span className="tabular-nums">{sorted.length} · {eur.format(totalEur)}</span>
      </div>
      <div className="mt-s flex h-8 w-full gap-[2px] overflow-hidden">
        {sorted.map((d, i) => (
          <Tooltip key={d.id}>
            <TooltipTrigger asChild>
              <div
                className="cursor-default transition-opacity hover:opacity-100"
                style={{
                  flexGrow: d.amountEur,
                  flexShrink: 1,
                  flexBasis: 0,
                  background: 'var(--color-fg)',
                  opacity: i % 2 === 0 ? 0.7 : 0.4,
                }}
                aria-label={`${d.donor} · ${eur.format(d.amountEur)}`}
              />
            </TooltipTrigger>
            <TooltipContent>
              <div className="font-semibold">{d.donor}</div>
              <div className="opacity-l tabular-nums">{eur.format(d.amountEur)} · {formatDate(d.dateReceived)}</div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
      <div className="mt-s flex flex-col">
        {sorted.map((d) => (
          <div
            key={d.id}
            className="flex items-baseline justify-between gap-m border-t py-s first:border-t-0"
            style={{ borderColor: ROW_BORDER }}
          >
            <div className="min-w-0">
              <div className="text-m" style={{ overflowWrap: 'anywhere' }}>{d.donor}</div>
              <div className="mt-xs text-s caption opacity-l">{formatDateShort(d.dateReceived, locale)}</div>
            </div>
            <div className="shrink-0 text-m font-semibold tabular-nums">{eur.format(d.amountEur)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
