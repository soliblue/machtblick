export type AgeBucket = 'unter-30' | '30-39' | '40-49' | '50-59' | '60-69' | '70-plus'

export const AGE_BUCKETS: AgeBucket[] = ['unter-30', '30-39', '40-49', '50-59', '60-69', '70-plus']

export const AGE_BUCKET_LABEL: Record<AgeBucket, string> = {
  'unter-30': 'Unter 30',
  '30-39': '30 bis 39',
  '40-49': '40 bis 49',
  '50-59': '50 bis 59',
  '60-69': '60 bis 69',
  '70-plus': '70 und älter',
}

export const isAgeBucket = (v: unknown): v is AgeBucket =>
  typeof v === 'string' && (AGE_BUCKETS as readonly string[]).includes(v)

const REFERENCE_YEAR = new Date().getFullYear()

export function ageBucketFor(yearOfBirth: number | null): AgeBucket | null {
  if (yearOfBirth === null) return null
  const age = REFERENCE_YEAR - yearOfBirth
  if (age < 30) return 'unter-30'
  if (age < 40) return '30-39'
  if (age < 50) return '40-49'
  if (age < 60) return '50-59'
  if (age < 70) return '60-69'
  return '70-plus'
}

export const SEX_LABEL: Record<'m' | 'f' | 'd', string> = {
  m: 'Männlich',
  f: 'Weiblich',
  d: 'Divers',
}

export const SEX_OPTIONS: Array<'m' | 'f' | 'd'> = ['m', 'f', 'd']

export const isSex = (v: unknown): v is 'm' | 'f' | 'd' =>
  v === 'm' || v === 'f' || v === 'd'

export const MANDATE_LABEL: Record<'direkt' | 'liste', string> = {
  direkt: 'Direktmandat',
  liste: 'Landesliste',
}

export const isMandateType = (v: unknown): v is 'direkt' | 'liste' =>
  v === 'direkt' || v === 'liste'
