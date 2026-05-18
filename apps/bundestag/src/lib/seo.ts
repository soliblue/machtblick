export const SITE_URL = 'https://machtblick.de'
export const SITE_NAME = 'Machtblick'
export const SITE_IMAGE = `${SITE_URL}/og-image.png`

type Meta = {
  title?: string
  description?: string
  canonical?: string
  type?: 'website' | 'article' | 'profile'
  image?: string
  imageAlt?: string
}

export function seoMeta({ title, description, canonical, type = 'website', image, imageAlt }: Meta) {
  const canonicalPath = canonical ? pagePath(canonical) : null
  const english = canonicalPath === '/en/' || canonicalPath?.startsWith('/en/')
  const fullTitle = title ? `${title} · ${SITE_NAME}` : SITE_NAME
  const desc = description ?? (english ? 'Transparency about votes, members, and parliamentary groups in the German Bundestag.' : 'Transparenz über Abstimmungen, Abgeordnete und Fraktionen des Deutschen Bundestags.')
  const url = canonicalPath ? `${SITE_URL}${canonicalPath}` : SITE_URL
  const img = image ? (image.startsWith('https://') || image.startsWith('http://') ? image : `${SITE_URL}${image.startsWith('/') ? image : `/${image}`}`) : SITE_IMAGE
  const alt = imageAlt ?? (english ? 'Machtblick preview for Bundestag votes, members, and parliamentary groups.' : 'Machtblick Vorschau für Abstimmungen, Abgeordnete und Fraktionen des Bundestags.')
  return [
    { title: fullTitle },
    { name: 'description', content: desc },
    { property: 'og:title', content: fullTitle },
    { property: 'og:description', content: desc },
    { property: 'og:url', content: url },
    { property: 'og:type', content: type },
    { property: 'og:site_name', content: SITE_NAME },
    { property: 'og:locale', content: english ? 'en_US' : 'de_DE' },
    { property: 'og:locale:alternate', content: english ? 'de_DE' : 'en_US' },
    { property: 'og:image', content: img },
    { property: 'og:image:secure_url', content: img },
    { property: 'og:image:type', content: 'image/png' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: alt },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: fullTitle },
    { name: 'twitter:description', content: desc },
    { name: 'twitter:image', content: img },
    { name: 'twitter:image:alt', content: alt },
  ]
}

export function canonicalLink(path: string) {
  const canonical = pagePath(path)
  const base = canonical === '/en/' ? '/' : canonical.startsWith('/en/') ? canonical.slice(3) : canonical
  const english = base === '/' ? '/en/' : `/en${base}`
  return [
    { rel: 'canonical', href: `${SITE_URL}${canonical}` },
    { rel: 'alternate', hreflang: 'de', href: `${SITE_URL}${base}` },
    { rel: 'alternate', hreflang: 'en', href: `${SITE_URL}${english}` },
    { rel: 'alternate', hreflang: 'x-default', href: `${SITE_URL}${base}` },
  ]
}

export function jsonLd(data: object) {
  return [{ type: 'application/ld+json', children: JSON.stringify(data) }]
}

export function alternateJsonLink(path: string) {
  const base = path.length > 1 ? path.replace(/\/$/, '') : path
  const normalized = base.startsWith('/en/motions/') ? base : base === '/en' ? '/' : base.startsWith('/en/') ? base.slice(3) : base
  return [{ rel: 'alternate', type: 'application/json', href: `${normalized}.json` }]
}

function pagePath(path: string): string {
  return path === '/' || path.endsWith('/') ? path : `${path}/`
}
