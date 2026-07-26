import type { ProgrammeCategory } from '@machtblick/berlin-db/types'

export const programmeCategories: ProgrammeCategory[] = [
  'wohnen',
  'mobilitaet',
  'klima-umwelt',
  'bildung',
  'wirtschaft-arbeit',
  'soziales-gesundheit',
  'sicherheit-migration',
  'verwaltung-demokratie',
  'vielfalt-teilhabe',
  'frieden',
  'kultur',
  'tierschutz'
]

export const programmeCategoryLabel: Record<ProgrammeCategory, string> = {
  wohnen: 'Wohnen',
  mobilitaet: 'Mobilität',
  'klima-umwelt': 'Klima und Umwelt',
  bildung: 'Bildung',
  'wirtschaft-arbeit': 'Wirtschaft und Arbeit',
  'soziales-gesundheit': 'Soziales und Gesundheit',
  'sicherheit-migration': 'Sicherheit und Migration',
  'verwaltung-demokratie': 'Verwaltung und Demokratie',
  'vielfalt-teilhabe': 'Vielfalt und Teilhabe',
  frieden: 'Frieden',
  kultur: 'Kultur',
  tierschutz: 'Tierschutz'
}
