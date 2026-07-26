import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import type { CandidateDetailData } from '@/server/candidate'
import { programmeStatusLabel } from '@/lib/programmeStatus'

type Props = {
  data: CandidateDetailData
}

export function CandidatePartyPositions({ data }: Props) {
  return data.programme && data.programme.status !== 'missing' ? (
    <section>
      <div className="text-s caption opacity-l">Partei, nicht persönliche Aussage</div>
      <h2 className="mt-xs font-display text-xl font-semibold">Aus dem Programm von {data.party.shortName}</h2>
      <p className="mt-s max-w-[620px] font-prose text-m opacity-l">
        Diese Positionen stammen aus dem Programm der Partei. Sie werden nicht automatisch dieser Person zugeschrieben.
      </p>
      <p className="mt-s text-s opacity-l">{programmeStatusLabel[data.programme.status]}: {data.programme.title}</p>
      {data.programme.summary ? <p className="mt-m font-prose text-l leading-[1.45]">{data.programme.summary}</p> : null}
      {data.programme?.topics.length ? (
        <div className="mt-l grid gap-l">
          {data.programme.topics.slice(0, 3).map((topic) => (
            <article key={topic.slug} className="pt-l first:pt-0">
              <h3 className="font-semibold">{topic.title}</h3>
              <p className="mt-xs font-prose text-l leading-[1.45]">{topic.summary}</p>
              {topic.positions.length ? (
                <ul className="mt-s grid gap-xs font-prose text-l leading-[1.45]">
                  {topic.positions.slice(0, 2).map((position) => (
                    <li key={position} className="flex gap-s">
                      <span aria-hidden="true" className="text-[var(--party-color)]">●</span>
                      <span>{position}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
          {data.programme.topics.length > 3 ? (
            <p className="text-s opacity-l">+ {data.programme.topics.length - 3} weitere Themen im vollständigen Programm</p>
          ) : null}
        </div>
      ) : null}
      <Link
        to="/programmes/$slug/"
        params={{ slug: data.party.slug }}
        className="mt-l inline-flex items-center gap-xs rounded-m border border-fg/15 px-m py-s text-m font-semibold hover:bg-surface"
      >
        Programm und Originale öffnen <ArrowRight size={14} />
      </Link>
    </section>
  ) : null
}
