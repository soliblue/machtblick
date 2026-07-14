export type Locale = 'de' | 'en'

export function localeFromPath(pathname: string): Locale {
  return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'de'
}

export function normalizeLocale(value: unknown): Locale {
  return value === 'en' ? 'en' : 'de'
}

export function withLocale(path: string, locale: Locale): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return locale === 'en' ? `/en${normalized}` : normalized
}

function withoutLocale(path: string): string {
  return path === '/en' ? '/' : path.startsWith('/en/') ? path.slice(3) : path
}

export function localizedPath(pathname: string, locale: Locale): string {
  const current = withoutLocale(pathname)
  const normalized = current.replace(/\/$/, '')
  const canonical = normalized
    .replace(/^\/(?:anfragen|questions)(?:\/.*)?$/, '/')
    .replace(/^\/antraege(\/|$)/, '/motions$1')
    .replace(/^\/reden(\/|$)/, '/speeches$1')
    .replace(/^\/impressum(\/|$)/, '/imprint$1')
    .replace(/^\/datenschutz(\/|$)/, '/privacy$1')
    .replace(/\/abstimmungen(\/|$)/, '/votes$1')
    .replace(/\/(?:anfragen|questions)(\/|$)/, '/votes$1')
    .replace(/\/antraege(\/|$)/, '/motions$1')
    .replace(/\/initiativen(\/|$)/, '/motions$1')
    .replace(/\/proposals(\/|$)/, '/motions$1')
    .replace(/\/initiatives(\/|$)/, '/motions$1')
    .replace(/\/reden(\/|$)/, '/speeches$1')
    .replace(/\/profil(\/|$)/, '/profile$1')
    .replace(/\/verlauf(\/|$)/, '/history$1')
  const path = canonical || '/'
  return withLocale(path === '/' || path.endsWith('/') ? path : `${path}/`, locale)
}
