export const SITE_URL = 'https://machtblick.de'
export const SITE_NAME = 'Machtblick'

type Meta = { title?: string; description?: string; canonical?: string; type?: 'website' | 'article' | 'profile' }

export function seoMeta({ title, description, canonical, type = 'website' }: Meta) {
  const canonicalPath = canonical ? pagePath(canonical) : null
  const english = canonicalPath === '/en/' || canonicalPath?.startsWith('/en/')
  const fullTitle = title ? `${title} · ${SITE_NAME}` : SITE_NAME
  const desc = description ?? (english ? 'Transparency about votes, members, and parliamentary groups in the German Bundestag.' : 'Transparenz über Abstimmungen, Abgeordnete und Fraktionen des Deutschen Bundestags.')
  const url = canonicalPath ? `${SITE_URL}${canonicalPath}` : SITE_URL
  return [
    { title: fullTitle },
    { name: 'description', content: desc },
    { property: 'og:title', content: fullTitle },
    { property: 'og:description', content: desc },
    { property: 'og:url', content: url },
    { property: 'og:type', content: type },
    { property: 'og:site_name', content: SITE_NAME },
    { property: 'og:locale', content: english ? 'en_US' : 'de_DE' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: fullTitle },
    { name: 'twitter:description', content: desc },
  ]
}

export function canonicalLink(path: string) {
  return [{ rel: 'canonical', href: `${SITE_URL}${pagePath(path)}` }]
}

export function jsonLd(data: object) {
  return [{ type: 'application/ld+json', children: JSON.stringify(data) }]
}

export function alternateJsonLink(path: string) {
  const base = path.length > 1 ? path.replace(/\/$/, '') : path
  const normalized = base === '/en' ? '/' : base.startsWith('/en/') ? base.slice(3) : base
  return [{ rel: 'alternate', type: 'application/json', href: `${normalized}.json` }]
}

function pagePath(path: string): string {
  return path === '/' || path.endsWith('/') ? path : `${path}/`
}
