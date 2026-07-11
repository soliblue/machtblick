import { Outlet, createRootRoute, HeadContent, Scripts, useRouterState } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import { StampFilter } from '@/views/votesList/StampFilter'
import { Nav } from '@/views/nav/Nav'
import { TestFlightPrompt } from '@/views/nav/TestFlightPrompt'
import { Footer } from '@/views/nav/Footer'
import globalsCss from '../styles/globals.css?url'
import { seoMeta, SITE_IMAGE, SITE_NAME, SITE_URL } from '@/lib/seo'
import { copy, LocaleProvider } from '@/lib/i18n'
import { localeFromPath } from '@/lib/locale'
import { NotFoundPage } from '@/views/notFound/NotFoundPage'
import { useTestFlightPrompt } from '@/hooks/useTestFlightPrompt'

const queryClient = new QueryClient()

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'theme-color', content: '#ffffff' },
      { name: 'application-name', content: SITE_NAME },
      { name: 'apple-mobile-web-app-title', content: SITE_NAME },
      { name: 'msapplication-TileColor', content: '#ffffff' },
      { name: 'msapplication-config', content: '/browserconfig.xml' },
      ...(import.meta.env.DEV ? [{ name: 'robots', content: 'noindex, nofollow' }] : [{ name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' }]),
      ...seoMeta({}),
    ],
    links: [
      { rel: 'preconnect', href: 'https://www.abgeordnetenwatch.de' },
      { rel: 'stylesheet', href: globalsCss },
      { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'icon', href: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
      { rel: 'icon', href: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png', sizes: '180x180' },
      { rel: 'mask-icon', href: '/safari-pinned-tab.svg', color: '#0A0A0A' },
      { rel: 'manifest', href: '/site.webmanifest' },
      { rel: 'sitemap', type: 'application/xml', title: 'Sitemap', href: `${SITE_URL}/sitemap.xml` },
      { rel: 'alternate', type: 'application/atom+xml', title: 'Machtblick: Abstimmungen im Bundestag', href: `${SITE_URL}/votes.xml` },
    ],
    scripts: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Organization',
              '@id': `${SITE_URL}/#organization`,
              name: SITE_NAME,
              url: SITE_URL,
              logo: SITE_IMAGE,
            },
            {
              '@type': 'WebSite',
              '@id': `${SITE_URL}/#website`,
              name: SITE_NAME,
              url: SITE_URL,
              inLanguage: ['de-DE', 'en-US'],
              description: 'Transparenz über Abstimmungen, Abgeordnete und Fraktionen des Deutschen Bundestags.',
              publisher: { '@id': `${SITE_URL}/#organization` },
            },
            {
              '@type': 'DataCatalog',
              '@id': `${SITE_URL}/#data-catalog`,
              name: 'Machtblick Bundestag data',
              url: SITE_URL,
              inLanguage: ['de-DE', 'en-US'],
              dataset: [
                {
                  '@type': 'Dataset',
                  name: 'Bundestag votes',
                  description: 'Current-term roll-call votes in the German Bundestag, including results, member choices, party summaries, and source document links.',
                  url: `${SITE_URL}/votes/`,
                  dateModified: __DATA_LAST_MODIFIED__,
                  creator: { '@id': `${SITE_URL}/#organization` },
                  distribution: [
                    { '@type': 'DataDownload', encodingFormat: 'application/json', inLanguage: 'de-DE', contentUrl: `${SITE_URL}/api/votes.json` },
                    { '@type': 'DataDownload', encodingFormat: 'application/json', inLanguage: 'en-US', contentUrl: `${SITE_URL}/en/api/votes.json` },
                  ],
                },
                {
                  '@type': 'Dataset',
                  name: 'Bundestag members',
                  description: 'Current German Bundestag member profiles with party affiliation, mandate details, voting records, and speeches.',
                  url: `${SITE_URL}/members/`,
                  dateModified: __DATA_LAST_MODIFIED__,
                  creator: { '@id': `${SITE_URL}/#organization` },
                  distribution: [
                    { '@type': 'DataDownload', encodingFormat: 'application/json', inLanguage: 'de-DE', contentUrl: `${SITE_URL}/api/members.json` },
                    { '@type': 'DataDownload', encodingFormat: 'application/json', inLanguage: 'en-US', contentUrl: `${SITE_URL}/en/api/members.json` },
                  ],
                },
                {
                  '@type': 'Dataset',
                  name: 'Bundestag parliamentary groups',
                  description: 'Parliamentary group data for the current German Bundestag, including seats, members, voting alignment, and party history.',
                  url: `${SITE_URL}/parties/`,
                  dateModified: __DATA_LAST_MODIFIED__,
                  creator: { '@id': `${SITE_URL}/#organization` },
                  distribution: [
                    { '@type': 'DataDownload', encodingFormat: 'application/json', inLanguage: 'de-DE', contentUrl: `${SITE_URL}/api/parties.json` },
                    { '@type': 'DataDownload', encodingFormat: 'application/json', inLanguage: 'en-US', contentUrl: `${SITE_URL}/en/api/parties.json` },
                  ],
                },
                {
                  '@type': 'Dataset',
                  name: 'Bundestag motions and bills',
                  description: 'Current-term motions and bills with status, sponsors, summaries, documents, signatories, and linked votes.',
                  url: `${SITE_URL}/motions/`,
                  dateModified: __DATA_LAST_MODIFIED__,
                  creator: { '@id': `${SITE_URL}/#organization` },
                  distribution: [
                    { '@type': 'DataDownload', encodingFormat: 'application/json', inLanguage: 'de-DE', contentUrl: `${SITE_URL}/api/motions.json` },
                    { '@type': 'DataDownload', encodingFormat: 'application/json', inLanguage: 'en-US', contentUrl: `${SITE_URL}/en/api/motions.json` },
                  ],
                },
                {
                  '@type': 'Dataset',
                  name: 'Bundestag speeches',
                  description: 'Current-term Bundestag speech metadata, speakers, debate links, and searchable speech text.',
                  url: `${SITE_URL}/speeches/`,
                  dateModified: __DATA_LAST_MODIFIED__,
                  creator: { '@id': `${SITE_URL}/#organization` },
                  distribution: [
                    { '@type': 'DataDownload', encodingFormat: 'application/json', inLanguage: 'de-DE', contentUrl: `${SITE_URL}/speeches-meta.json` },
                    { '@type': 'DataDownload', encodingFormat: 'application/json', inLanguage: 'en-US', contentUrl: `${SITE_URL}/en/speeches-meta.json` },
                  ],
                },
              ],
            },
          ],
        }),
      },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundPage,
})

function RootComponent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const locale = localeFromPath(pathname)
  const t = copy[locale]
  const testFlightPrompt = useTestFlightPrompt()
  return (
    <html lang={locale} prefix="og: https://ogp.me/ns#">
      <head>
        <HeadContent />
      </head>
      <body className="bg-background text-fg">
        <QueryClientProvider client={queryClient}>
          <LocaleProvider locale={locale}>
            <TooltipProvider delayDuration={200}>
              <StampFilter />
              <Nav />
              <TestFlightPrompt
                visible={testFlightPrompt.visible}
                title={t.testFlightPromptTitle}
                description={t.testFlightPromptDescription}
                actionLabel={t.testFlightPromptAction}
                dismissLabel={t.testFlightPromptDismiss}
                closeLabel={t.testFlightPromptClose}
                onDismiss={testFlightPrompt.dismiss}
              />
              <Outlet />
              <Footer />
            </TooltipProvider>
          </LocaleProvider>
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  )
}
