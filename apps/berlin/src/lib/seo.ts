export const SITE_NAME = 'Machtblick Berlin'
export const SITE_URL = 'https://berlin.machtblick.de'

export function pageMeta(title: string, description: string, path = '/') {
  const url = `${SITE_URL}${path}`
  return {
    meta: [
      { title: `${title} | ${SITE_NAME}` },
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: url }
    ],
    links: [{ rel: 'canonical', href: url }]
  }
}
