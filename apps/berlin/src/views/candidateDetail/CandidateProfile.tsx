import type { BerlinCandidateProfile } from '@machtblick/berlin-db/types'

type Props = {
  profile: BerlinCandidateProfile | null
}

export function CandidateProfile({ profile }: Props) {
  return profile?.biographySummary ? (
    <p className="font-prose text-l">{profile.biographySummary}</p>
  ) : null
}
