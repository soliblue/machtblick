import type { BerlinProgrammeTopic } from '@machtblick/berlin-db/types'

type Props = {
  topic: BerlinProgrammeTopic
  number: number
}

export function ProgrammeTopic({ topic, number }: Props) {
  return (
    <section id={topic.slug} className="scroll-mt-[78px] border-t border-fg/15 py-xl">
      <div className="text-s caption opacity-l">Thema {String(number).padStart(2, '0')}</div>
      <h2 className="mt-xs font-display text-xl font-semibold">{topic.title}</h2>
      <p className="mt-s font-prose text-l">{topic.summary}</p>
      {topic.positions.length ? (
        <ul className="mt-l grid gap-s">
          {topic.positions.map((position) => (
            <li key={position} className="rounded-m bg-surface px-m py-s text-m">{position}</li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
