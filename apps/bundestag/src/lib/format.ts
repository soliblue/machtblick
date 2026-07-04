export function formatDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

export function formatDateLong(iso: string, locale: 'de' | 'en' = 'de') {
  return new Date(`${iso}T12:00:00`).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function formatDateShort(iso: string, locale: 'de' | 'en' = 'de') {
  return new Date(`${iso}T12:00:00`).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function pct(n: number) {
  return `${Math.round(n * 100)}%`
}
