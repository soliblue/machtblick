import type { CandidateItem } from '@/server/catalog'

export const candidateStatusLabel: Record<CandidateItem['sourceStatus'], string> = {
  party_published: 'Partei-veröffentlicht',
  officially_admitted: 'Amtlich veröffentlicht'
}
