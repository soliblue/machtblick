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

type CanonicalLinkOptions = {
  englishAlternate?: boolean
}

export function canonicalLink(path: string, options: CanonicalLinkOptions = {}) {
  const canonical = pagePath(path)
  const base = canonical === '/en/' ? '/' : canonical.startsWith('/en/') ? canonical.slice(3) : canonical
  const english = base === '/' ? '/en/' : `/en${base}`
  return [
    { rel: 'canonical', href: `${SITE_URL}${canonical}` },
    { rel: 'alternate', hrefLang: 'de', href: `${SITE_URL}${base}` },
    ...(options.englishAlternate ?? true ? [{ rel: 'alternate', hrefLang: 'en', href: `${SITE_URL}${english}` }] : []),
    { rel: 'alternate', hrefLang: 'x-default', href: `${SITE_URL}${base}` },
  ]
}

export function jsonLd(data: object) {
  return [{ type: 'application/ld+json', children: JSON.stringify(data) }]
}

export function plainDescription(text: string, max = 160) {
  const plain = text.replace(/[*_`#]+/g, '').replace(/\s+/g, ' ').trim()
  const window = plain.slice(0, max + 1)
  let sentenceEnd = 0
  for (const m of window.matchAll(/[.!?](?= )/g)) {
    const end = (m.index ?? 0) + 1
    if (!/(\s|^)([0-9]{1,2}|[A-Za-zÄÖÜäöü])\.$/.test(window.slice(0, end))) sentenceEnd = end
  }
  return plain.length <= max
    ? plain
    : sentenceEnd >= 80
      ? plain.slice(0, sentenceEnd)
      : `${plain.slice(0, Math.max(plain.lastIndexOf(' ', max - 2), 1))} …`
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return jsonLd({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${pagePath(item.path)}`,
    })),
  })
}

export function alternateJsonLink(path: string) {
  const base = path.length > 1 ? path.replace(/\/$/, '') : path
  const normalized = base.startsWith('/en/motions/') ? base : base === '/en' ? '/' : base.startsWith('/en/') ? base.slice(3) : base
  return [{ rel: 'alternate', type: 'application/json', href: `${normalized}.json` }]
}

function pagePath(path: string): string {
  return path === '/' || path.endsWith('/') ? path : `${path}/`
}
