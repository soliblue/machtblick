import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import { Footer } from '@/views/nav/Footer'
import { Nav } from '@/views/nav/Nav'
import { useTheme } from '@/hooks/useTheme'
import { NotFoundPage } from '@/views/notFound/NotFoundPage'
import { SITE_NAME, SITE_URL } from '@/lib/seo'
import globalsCss from '../styles/globals.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'theme-color', content: '#ffffff' },
      { name: 'application-name', content: SITE_NAME },
      { name: 'robots', content: import.meta.env.DEV ? 'noindex, nofollow' : 'index, follow, max-snippet:-1, max-image-preview:large' }
    ],
    links: [
      { rel: 'preload', href: '/fonts/fraunces-latin-600-normal.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
      { rel: 'stylesheet', href: globalsCss }
    ],
    scripts: [
      {
        children: `(function(){var d=localStorage.getItem('machtblick.theme')==='dark';document.documentElement.dataset.theme=d?'dark':'light';document.documentElement.style.colorScheme=d?'dark':'light'})()`
      },
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: SITE_NAME,
          url: SITE_URL,
          inLanguage: 'de-DE',
          dateModified: __DATA_LAST_MODIFIED__
        })
      }
    ]
  }),
  notFoundComponent: NotFoundPage,
  component: RootComponent
})

function RootComponent() {
  const theme = useTheme()
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-background text-fg">
        <Nav theme={theme.theme} onThemeChange={theme.selectTheme} />
        <Outlet />
        <Footer />
        <Scripts />
      </body>
    </html>
  )
}
