import { useState } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'
import { ScrollEyeWordmark } from '@/views/nav/ScrollEyeWordmark'
import { useCopy } from '@/lib/i18n'
import { localeFromPath, localizedPath, withLocale } from '@/lib/locale'

export function Nav() {
  const [open, setOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const locale = localeFromPath(pathname)
  const t = useCopy()
  const linkClass = 'hover:opacity-100'
  const href = (path: string) => withLocale(path, locale)
  const deHref = localizedPath(pathname, 'de')
  const enHref = localizedPath(pathname, 'en')
  const current = locale === 'en' ? { flag: '🇬🇧', label: t.english } : { flag: '🇩🇪', label: t.german }
  const other = locale === 'en' ? { flag: '🇩🇪', label: t.german, href: deHref } : { flag: '🇬🇧', label: t.english, href: enHref }
  return (
    <nav
      className="sticky top-0 z-50 bg-background"
      style={{ borderBottom: '1px solid color-mix(in oklab, var(--color-fg) 15%, transparent)' }}
    >
      <div className="mx-auto flex max-w-3xl items-center gap-l px-l py-m text-m">
        <a href={href('/votes/')} onClick={() => setOpen(false)} aria-label="Machtblick"><ScrollEyeWordmark /></a>
        <div className="ml-auto hidden gap-l opacity-l sm:flex">
          <a href={href('/votes/')} className={linkClass}>{t.navVotes}</a>
          <a href={href('/motions/')} className={linkClass}>{t.navMotions}</a>
          <a href={href('/members/')} className={linkClass}>{t.navMembers}</a>
          <a href={href('/speeches/')} className={linkClass}>{t.navSpeeches}</a>
          <a href={href('/parties/')} className={linkClass}>{t.navParties}</a>
        </div>
        <div
          aria-label={t.language}
          className="group relative hidden w-[120px] text-s sm:block"
          onKeyDown={(e) => e.key === 'Escape' && setLangOpen(false)}
          onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setLangOpen(false)}
        >
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={langOpen}
            onClick={() => setLangOpen((v) => !v)}
            className="flex h-[32px] w-full items-center justify-center gap-xs border bg-background px-s"
            style={{ borderColor: 'color-mix(in oklab, var(--color-fg) 15%, transparent)' }}
          >
            <span aria-hidden="true">{current.flag}</span>
            <span>{current.label}</span>
          </button>
          <div
            role="menu"
            className={`absolute right-0 top-full z-50 mt-xs w-[120px] border bg-background transition-opacity group-hover:visible group-hover:opacity-100 ${langOpen ? 'visible opacity-100' : 'invisible opacity-0'}`}
            style={{ borderColor: 'color-mix(in oklab, var(--color-fg) 15%, transparent)' }}
          >
            <a role="menuitem" href={other.href} tabIndex={langOpen ? 0 : -1} className="flex h-[36px] items-center justify-center gap-xs px-s opacity-l transition-opacity hover:bg-surface hover:opacity-100 focus:bg-surface focus:opacity-100">
              <span aria-hidden="true">{other.flag}</span>
              <span>{other.label}</span>
            </a>
          </div>
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
          <a href={href('/motions/')} className={linkClass} onClick={() => setOpen(false)}>{t.navMotions}</a>
          <a href={href('/members/')} className={linkClass} onClick={() => setOpen(false)}>{t.navMembers}</a>
          <a href={href('/speeches/')} className={linkClass} onClick={() => setOpen(false)}>{t.navSpeeches}</a>
          <a href={href('/parties/')} className={linkClass} onClick={() => setOpen(false)}>{t.navParties}</a>
          <div className="flex gap-s">
            <a
              href={deHref}
              className={`border px-m py-xs ${locale === 'de' ? 'opacity-100' : 'opacity-l'}`}
              style={{ borderColor: 'color-mix(in oklab, var(--color-fg) 15%, transparent)' }}
              onClick={() => setOpen(false)}
            >
              🇩🇪 {t.german}
            </a>
            <a
              href={enHref}
              className={`border px-m py-xs ${locale === 'en' ? 'opacity-100' : 'opacity-l'}`}
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
