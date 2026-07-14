import type { Locale } from '@/lib/locale'

type Props = {
  locale: Locale
  deHref: string
  enHref: string
  label: string
  germanLabel: string
  englishLabel: string
  expanded?: boolean
  onSelect?: () => void
}

export function LanguagePicker({
  locale,
  deHref,
  enHref,
  label,
  germanLabel,
  englishLabel,
  expanded = false,
  onSelect,
}: Props) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`flex overflow-hidden rounded-m text-s ${expanded ? 'w-full' : 'w-fit'}`}
    >
      {[
        { value: 'de' as const, href: deHref, shortLabel: 'DE', label: germanLabel },
        { value: 'en' as const, href: enHref, shortLabel: 'EN', label: englishLabel },
      ].map(({ value, href, shortLabel, label: optionLabel }) => (
        <a
          key={value}
          href={href}
          aria-label={optionLabel}
          aria-current={locale === value ? 'page' : undefined}
          className={`flex min-w-0 items-center justify-center px-m transition-colors focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 ${expanded ? 'h-[44px] flex-1 text-m' : 'h-[32px]'} ${locale === value ? 'bg-fg font-semibold text-background focus-visible:outline-background' : 'bg-elevated hover:bg-surface focus-visible:outline-fg'}`}
          onClick={onSelect}
        >
          {expanded ? optionLabel : shortLabel}
        </a>
      ))}
    </div>
  )
}
