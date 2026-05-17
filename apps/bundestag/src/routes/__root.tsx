import { useState, type ReactNode } from 'react'
import { Outlet, createRootRoute, HeadContent, Scripts, useRouterState } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Menu, X } from 'lucide-react'
import { TooltipProvider } from '@/components/ui/tooltip'

const queryClient = new QueryClient()
import { StampFilter } from '@/views/votesList/StampFilter'
import { ScrollEyeWordmark } from '@/views/nav/ScrollEyeWordmark'
import { Footer } from '@/views/nav/Footer'
import globalsCss from '../styles/globals.css?url'
import { seoMeta, SITE_NAME, SITE_URL } from '@/lib/seo'
import { LocaleProvider, useCopy } from '@/lib/i18n'
import { localeFromPath, localizedPath, withLocale } from '@/lib/locale'
import { NotFoundPage } from '@/views/notFound/NotFoundPage'

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
          inLanguage: ['de-DE', 'en-US'],
          description: 'Transparenz über Abstimmungen, Abgeordnete und Fraktionen des Deutschen Bundestags.',
          publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
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
  return (
    <html lang={locale}>
      <head>
        <HeadContent />
      </head>
      <body className="bg-background text-fg">
        <QueryClientProvider client={queryClient}>
          <LocaleProvider locale={locale}>
            <TooltipProvider delayDuration={200}>
              <StampFilter />
              <Nav />
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

function Nav() {
  const [open, setOpen] = useState(false)
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const locale = localeFromPath(pathname)
  const t = useCopy()
  const linkClass = 'hover:opacity-100'
  const href = (path: string) => withLocale(path, locale)
  const deHref = localizedPath(pathname, 'de')
  const enHref = localizedPath(pathname, 'en')
  return (
    <nav
      className="sticky top-0 z-50 bg-background/85 backdrop-blur-md"
      style={{ borderBottom: '1px solid color-mix(in oklab, var(--color-fg) 15%, transparent)' }}
    >
      <div className="mx-auto flex max-w-3xl items-center gap-l px-l py-m text-m">
        <a href={href('/votes/')} onClick={() => setOpen(false)} aria-label="Machtblick"><ScrollEyeWordmark /></a>
        <div className="ml-auto hidden gap-l opacity-l sm:flex">
          <a href={href('/votes/')} className={linkClass}>{t.navVotes}</a>
          <a href={href('/members/')} className={linkClass}>{t.navMembers}</a>
          <a href={href('/speeches/')} className={linkClass}>{t.navSpeeches}</a>
          <a href={href('/parties/')} className={linkClass}>{t.navParties}</a>
        </div>
        <div
          aria-label={t.language}
          className="group relative hidden h-[32px] w-[120px] overflow-hidden rounded-full border bg-background text-s transition-[height] duration-200 focus-within:h-[72px] hover:h-[72px] sm:block"
          style={{ borderColor: 'color-mix(in oklab, var(--color-fg) 15%, transparent)' }}
        >
          {locale === 'en' ? (
            <>
              <a href={enHref} aria-current="page" className="flex h-[32px] items-center justify-center gap-xs px-s">
                <span aria-hidden="true">🇬🇧</span>
                <span>{t.english}</span>
              </a>
              <a href={deHref} className="flex h-[40px] items-center justify-center gap-xs px-s opacity-l transition-opacity hover:bg-surface hover:opacity-100 focus:bg-surface focus:opacity-100">
                <span aria-hidden="true">🇩🇪</span>
                <span>{t.german}</span>
              </a>
            </>
          ) : (
            <>
              <a href={deHref} aria-current="page" className="flex h-[32px] items-center justify-center gap-xs px-s">
                <span aria-hidden="true">🇩🇪</span>
                <span>{t.german}</span>
              </a>
              <a href={enHref} className="flex h-[40px] items-center justify-center gap-xs px-s opacity-l transition-opacity hover:bg-surface hover:opacity-100 focus:bg-surface focus:opacity-100">
                <span aria-hidden="true">🇬🇧</span>
                <span>{t.english}</span>
              </a>
            </>
          )}
        </div>
        <button
          type="button"
          aria-label={open ? t.menuClose : t.menuOpen}
          onClick={() => setOpen((v) => !v)}
          className="ml-auto sm:hidden"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <div className="flex flex-col gap-m px-l pb-m text-m opacity-l sm:hidden">
          <a href={href('/votes/')} className={linkClass} onClick={() => setOpen(false)}>{t.navVotes}</a>
          <a href={href('/members/')} className={linkClass} onClick={() => setOpen(false)}>{t.navMembers}</a>
          <a href={href('/speeches/')} className={linkClass} onClick={() => setOpen(false)}>{t.navSpeeches}</a>
          <a href={href('/parties/')} className={linkClass} onClick={() => setOpen(false)}>{t.navParties}</a>
          <div className="flex gap-s">
            <a
              href={deHref}
              className={`rounded-full border px-m py-xs ${locale === 'de' ? 'opacity-100' : 'opacity-l'}`}
              style={{ borderColor: 'color-mix(in oklab, var(--color-fg) 15%, transparent)' }}
              onClick={() => setOpen(false)}
            >
              🇩🇪 {t.german}
            </a>
            <a
              href={enHref}
              className={`rounded-full border px-m py-xs ${locale === 'en' ? 'opacity-100' : 'opacity-l'}`}
              style={{ borderColor: 'color-mix(in oklab, var(--color-fg) 15%, transparent)' }}
              onClick={() => setOpen(false)}
            >
              🇬🇧 {t.english}
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}
