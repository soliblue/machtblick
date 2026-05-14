import { useState, type ReactNode } from 'react'
import { Outlet, createRootRoute, HeadContent, Scripts } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Menu, X } from 'lucide-react'
import { Link } from '../lib/Link'
import { TooltipProvider } from '@/components/ui/tooltip'

const queryClient = new QueryClient()
import { StampFilter } from '@/views/votesList/StampFilter'
import { ScrollEyeWordmark } from '@/views/nav/ScrollEyeWordmark'
import { Footer } from '@/views/nav/Footer'
import globalsCss from '../styles/globals.css?url'
import { seoMeta, SITE_NAME, SITE_URL } from '@/lib/seo'

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
      { httpEquiv: 'content-language', content: 'de' },
      ...(import.meta.env.DEV ? [{ name: 'robots', content: 'noindex, nofollow' }] : []),
      ...seoMeta({}),
    ],
    links: [
      { rel: 'stylesheet', href: globalsCss },
      { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'icon', href: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
      { rel: 'icon', href: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png', sizes: '180x180' },
      { rel: 'mask-icon', href: '/safari-pinned-tab.svg', color: '#0A0A0A' },
      { rel: 'manifest', href: '/site.webmanifest' },
      { rel: 'alternate', type: 'application/rss+xml', title: SITE_NAME, href: `${SITE_URL}/sitemap.xml` },
    ],
    scripts: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: SITE_NAME,
          url: SITE_URL,
          inLanguage: 'de-DE',
          description: 'Transparenz über Abstimmungen, Abgeordnete und Fraktionen des Deutschen Bundestags.',
          publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
        }),
      },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <html lang="de">
      <head>
        <HeadContent />
      </head>
      <body className="bg-background text-fg">
        <QueryClientProvider client={queryClient}>
          <TooltipProvider delayDuration={200}>
            <StampFilter />
            <Nav />
            <Outlet />
            <Footer />
          </TooltipProvider>
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  )
}

function Nav() {
  const [open, setOpen] = useState(false)
  const linkClass = 'hover:opacity-100 [&.active]:font-semibold [&.active]:opacity-100'
  return (
    <nav
      className="sticky top-0 z-50 bg-background/85 backdrop-blur-md"
      style={{ borderBottom: '1px solid color-mix(in oklab, var(--color-fg) 15%, transparent)' }}
    >
      <div className="mx-auto flex max-w-3xl items-center gap-l px-l py-m text-m">
        <Link to="/" onClick={() => setOpen(false)} aria-label="Machtblick"><ScrollEyeWordmark /></Link>
        <div className="ml-auto hidden gap-l opacity-l sm:flex">
          <Link to="/votes/" className={linkClass}>Abstimmungen</Link>
          <Link to="/members/" className={linkClass}>Abgeordnete</Link>
          <Link to="/reden/" className={linkClass}>Reden</Link>
          <Link to="/parties/" className={linkClass}>Fraktionen</Link>
        </div>
        <button
          type="button"
          aria-label={open ? 'Menü schließen' : 'Menü öffnen'}
          onClick={() => setOpen((v) => !v)}
          className="ml-auto sm:hidden"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <div className="flex flex-col gap-m px-l pb-m text-m opacity-l sm:hidden">
          <Link to="/votes/" className={linkClass} onClick={() => setOpen(false)}>Abstimmungen</Link>
          <Link to="/members/" className={linkClass} onClick={() => setOpen(false)}>Abgeordnete</Link>
          <Link to="/reden/" className={linkClass} onClick={() => setOpen(false)}>Reden</Link>
          <Link to="/parties/" className={linkClass} onClick={() => setOpen(false)}>Fraktionen</Link>
        </div>
      )}
    </nav>
  )
}
