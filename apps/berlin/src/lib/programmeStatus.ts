import type { ProgrammeStatus } from '@machtblick/berlin-db/types'

export const programmeStatusLabel: Record<ProgrammeStatus, string> = {
  current_2026: 'Wahlprogramm 2026',
  draft_2026: 'Entwurf 2026',
  campaign_material: 'Aktuelles Wahlmaterial',
  general: 'Allgemeines Programm',
  missing: 'Noch nicht veröffentlicht'
}

export const programmeStatusRank: Record<ProgrammeStatus, number> = {
  current_2026: 0,
  draft_2026: 1,
  campaign_material: 2,
  general: 3,
  missing: 4
}
