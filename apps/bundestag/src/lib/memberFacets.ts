export type MemberSex = 'm' | 'f' | 'd'
export type MandateType = 'direkt' | 'liste'
export type AgeBucket = 'unter-30' | '30-39' | '40-49' | '50-59' | '60-69' | '70-plus'

export const AGE_BUCKETS: AgeBucket[] = ['unter-30', '30-39', '40-49', '50-59', '60-69', '70-plus']

export const isAgeBucket = (v: unknown): v is AgeBucket =>
  typeof v === 'string' && (AGE_BUCKETS as readonly string[]).includes(v)

export const isSex = (v: unknown): v is MemberSex =>
  v === 'm' || v === 'f' || v === 'd'

export const isMandateType = (v: unknown): v is MandateType =>
  v === 'direkt' || v === 'liste'

export const parseSex = (raw: string | null): MemberSex | null => (isSex(raw) ? raw : null)

export const parseMandate = (raw: string | null): MandateType | null => (isMandateType(raw) ? raw : null)

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
