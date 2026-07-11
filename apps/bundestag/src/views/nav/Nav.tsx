import { useState } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'
import { ScrollEyeWordmark } from '@/views/nav/ScrollEyeWordmark'
import { useCopy } from '@/lib/i18n'
import { localeFromPath, localizedPath, withLocale } from '@/lib/locale'

export function Nav() {
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
      className="sticky top-0 z-50 bg-background"
      style={{ borderBottom: '1px solid color-mix(in oklab, var(--color-fg) 15%, transparent)' }}
    >
      <div className="mx-auto flex max-w-3xl items-center gap-l px-l py-m text-m">
        <a href={href('/votes/')} onClick={() => setOpen(false)} aria-label="Machtblick"><ScrollEyeWordmark /></a>
        <div className="ml-auto hidden gap-l opacity-l sm:flex">
          <a href={href('/votes/')} className={linkClass}>{t.navVotes}</a>
          <a href={href('/members/')} className={linkClass}>{t.navMembers}</a>
          <a href={href('/parties/')} className={linkClass}>{t.navParties}</a>
        </div>
        <div
          role="group"
          aria-label={t.language}
          className="hidden overflow-hidden rounded-m border text-s sm:flex"
          style={{ borderColor: 'color-mix(in oklab, var(--color-fg) 15%, transparent)' }}
        >
          <a
            href={deHref}
            aria-label={t.german}
            aria-current={locale === 'de' ? 'page' : undefined}
            title={t.german}
            className={`flex h-[32px] w-[36px] items-center justify-center transition-colors ${locale === 'de' ? 'bg-surface opacity-100' : 'opacity-l hover:bg-surface hover:opacity-100'}`}
          >
            <span aria-hidden="true">🇩🇪</span>
          </a>
          <a
            href={enHref}
            aria-label={t.english}
            aria-current={locale === 'en' ? 'page' : undefined}
            title={t.english}
            className={`flex h-[32px] w-[36px] items-center justify-center border-l border-fg/15 transition-colors ${locale === 'en' ? 'bg-surface opacity-100' : 'opacity-l hover:bg-surface hover:opacity-100'}`}
          >
            <span aria-hidden="true">🇬🇧</span>
          </a>
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
          <a href={href('/parties/')} className={linkClass} onClick={() => setOpen(false)}>{t.navParties}</a>
          <div
            role="group"
            aria-label={t.language}
            className="flex w-fit overflow-hidden rounded-m border"
            style={{ borderColor: 'color-mix(in oklab, var(--color-fg) 15%, transparent)' }}
          >
            <a
              href={deHref}
              aria-label={t.german}
              aria-current={locale === 'de' ? 'page' : undefined}
              title={t.german}
              className={`flex h-[32px] w-[40px] items-center justify-center ${locale === 'de' ? 'bg-surface opacity-100' : 'opacity-l'}`}
              onClick={() => setOpen(false)}
            >
              <span aria-hidden="true">🇩🇪</span>
            </a>
            <a
              href={enHref}
              aria-label={t.english}
              aria-current={locale === 'en' ? 'page' : undefined}
              title={t.english}
              className={`flex h-[32px] w-[40px] items-center justify-center border-l border-fg/15 ${locale === 'en' ? 'bg-surface opacity-100' : 'opacity-l'}`}
              onClick={() => setOpen(false)}
            >
              <span aria-hidden="true">🇬🇧</span>
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}
