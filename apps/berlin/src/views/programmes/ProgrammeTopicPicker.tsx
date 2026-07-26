import type { ProgrammeCategory } from '@machtblick/berlin-db/types'
import { programmeCategories, programmeCategoryLabel } from '@/lib/programmeCategories'

type Props = {
  value: ProgrammeCategory
  onChange: (topic: ProgrammeCategory) => void
  label?: string
}

export function ProgrammeTopicPicker({ value, onChange, label = 'Thema auswählen' }: Props) {
  return (
    <section className="py-l">
      <div className="text-s caption opacity-l">{label}</div>
      <div className="-mx-l mt-s flex gap-xs overflow-x-auto px-l [scrollbar-width:none]">
        {programmeCategories.map((topic) => (
          <button
            key={topic}
            type="button"
            aria-pressed={value === topic}
            onClick={() => onChange(topic)}
            className={`shrink-0 rounded-full border px-m py-s text-m ${
              value === topic ? 'border-fg bg-fg text-background' : 'border-fg/15 hover:bg-surface'
            }`}
          >
            {programmeCategoryLabel[topic]}
          </button>
        ))}
      </div>
    </section>
  )
}
