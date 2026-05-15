export type Locale = 'de' | 'en'

export const LOCALES = ['de', 'en'] as const

export function localeFromPath(pathname: string): Locale {
  return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'de'
}

export function normalizeLocale(value: unknown): Locale {
  return value === 'en' ? 'en' : 'de'
}

export function withLocale(path: string, locale: Locale): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return locale === 'en' ? `/en${normalized === '/' ? '' : normalized}` : normalized
}

export function withoutLocale(path: string): string {
  return path === '/en' ? '/' : path.startsWith('/en/') ? path.slice(3) : path
}
