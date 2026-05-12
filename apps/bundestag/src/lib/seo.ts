export const SITE_URL = 'https://machtblick.de'
export const SITE_NAME = 'Machtblick'

type Meta = { title?: string; description?: string; canonical?: string; type?: 'website' | 'article' | 'profile' }

export function seoMeta({ title, description, canonical, type = 'website' }: Meta) {
  const fullTitle = title ? `${title} · ${SITE_NAME}` : SITE_NAME
  const desc = description ?? 'Transparenz über Abstimmungen, Abgeordnete und Fraktionen des Deutschen Bundestags.'
  const url = canonical ? `${SITE_URL}${canonical}` : SITE_URL
  return [
    { title: fullTitle },
    { name: 'description', content: desc },
    { property: 'og:title', content: fullTitle },
    { property: 'og:description', content: desc },
    { property: 'og:url', content: url },
    { property: 'og:type', content: type },
    { property: 'og:site_name', content: SITE_NAME },
    { property: 'og:locale', content: 'de_DE' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: fullTitle },
    { name: 'twitter:description', content: desc },
  ]
}

export function canonicalLink(path: string) {
  return [{ rel: 'canonical', href: `${SITE_URL}${path}` }]
}

export function jsonLd(data: object) {
  return [{ type: 'application/ld+json', children: JSON.stringify(data) }]
}
