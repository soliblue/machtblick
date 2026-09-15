import type { useVoteResultTable } from '@/hooks/useVoteResultTable'
import { useCopy, useLocale } from '@/lib/i18n'
import { PARTY_SLUG, partyLabel } from '@/lib/parties'
import { withLocale } from '@/lib/locale'

type Props = ReturnType<typeof useVoteResultTable>

export function VoteResultTable({ rows, columns }: Props) {
  const t = useCopy()
  const locale = useLocale()
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-m tabular-nums">
        <caption className="sr-only">{t.result}</caption>
        <thead>
          <tr className="border-b border-fg/15 text-s">
            <th scope="col" className="py-m pl-m pr-s text-left font-normal opacity-l">{t.party}</th>
            {columns.map((column) => (
              <th key={column.key} scope="col" className={`px-xs py-m last:pr-xl text-right font-normal capitalize ${column.color}`}>
                <span className="desk:hidden" title={column.label}>{column.shortLabel}</span>
                <span className="hidden desk:inline">{column.label}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.party ?? 'total'} className={`border-b border-fg/15 ${row.party === null ? 'bg-surface font-semibold' : ''}`}>
              <th scope="row" className={`py-l pl-m pr-s text-left ${row.party === null ? 'font-semibold' : 'font-normal'}`}>
                {row.party === null ? t.resultTotal : (
                  <a href={withLocale(`/parties/${PARTY_SLUG[row.party] ?? row.party}/`, locale)} className="underline-offset-4 hover:underline">
                    {partyLabel(row.party, locale)}
                  </a>
                )}
              </th>
              {columns.map((column) => (
                <td key={column.key} className={`px-xs py-l last:pr-xl text-right ${row.party === null ? 'font-display text-xl font-semibold' : ''} ${row[column.key] === 0 ? 'text-fg/40' : column.color}`}>
                  {row[column.key] === null ? <span className="text-s font-sans font-normal text-fg/70" title={t.resultUnavailable}>{t.resultUnavailableShort}</span> : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
