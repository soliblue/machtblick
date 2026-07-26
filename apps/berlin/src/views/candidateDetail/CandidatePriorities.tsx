import type { BerlinCandidateProfile } from '@machtblick/berlin-db/types'

type Props = {
  profile: BerlinCandidateProfile | null
}

export function CandidatePriorities({ profile }: Props) {
  return profile?.priorities.length ? (
    <section>
      <div className="text-s caption opacity-l">Von der Person selbst genannt</div>
      <h2 className="mt-xs font-display text-xl font-semibold">Persönliches Programm</h2>
      <ul className="mt-m grid gap-s">
        {profile.priorities.map((priority) => (
          <li key={priority} className="border-l-2 border-[var(--party-color)] py-xs pl-m font-prose text-l leading-[1.45]">
            {priority}
          </li>
        ))}
      </ul>
    </section>
  ) : null
}
