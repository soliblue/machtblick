import { useLocale } from '@/lib/i18n'

type Props = {
  subjects: string[]
}

export function AntragSubjectChips({ subjects }: Props) {
  const locale = useLocale()
  return subjects.length > 0 ? (
    <div
      role="list"
      aria-label={locale === 'en' ? 'Subjects' : 'Themen'}
      className="scroll-rail -mx-l mt-xl overflow-x-auto pb-xs [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <div className="flex w-max gap-xs px-l">
        {subjects.map((subject) => (
          <span
            key={subject}
            role="listitem"
            className="inline-flex flex-none items-center whitespace-nowrap rounded-m border border-fg/15 px-s py-xs text-s opacity-l"
          >
            {subject}
          </span>
        ))}
      </div>
    </div>
  ) : null
}
