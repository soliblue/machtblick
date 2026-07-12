import { useState } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'
import { ScrollEyeWordmark } from '@/views/nav/ScrollEyeWordmark'
import { useCopy } from '@/lib/i18n'
import { localeFromPath, localizedPath, withLocale } from '@/lib/locale'
import type { ThemeMode } from '@/hooks/useTheme'
import { LanguagePicker } from './LanguagePicker'
import { ThemePicker } from './ThemePicker'

type Props = {
  theme: ThemeMode
  onThemeChange: (theme: ThemeMode) => void
}

export function Nav({ theme, onThemeChange }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const locale = localeFromPath(pathname)
  const t = useCopy()
  const linkClass = 'opacity-l hover:opacity-100'
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
        <div className="ml-auto hidden gap-l desk:flex">
          <a href={href('/votes/')} className={linkClass}>{t.navVotes}</a>
          <a href={href('/members/')} className={linkClass}>{t.navMembers}</a>
          <a href={href('/parties/')} className={linkClass}>{t.navParties}</a>
        </div>
        <div className="hidden items-center gap-m desk:flex">
          <ThemePicker
            value={theme}
            label={t.appearance}
            lightLabel={t.themeLight}
            darkLabel={t.themeDark}
            onChange={onThemeChange}
          />
          <LanguagePicker
            locale={locale}
            deHref={deHref}
            enHref={enHref}
            label={t.language}
            germanLabel={t.german}
            englishLabel={t.english}
          />
        </div>
        <button
          type="button"
          aria-label={open ? t.menuClose : t.menuOpen}
          onClick={() => setOpen((v) => !v)}
          className="ml-auto desk:hidden"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <div className="absolute inset-x-0 top-full flex max-h-[calc(100svh-54px)] flex-col gap-l overflow-y-auto overscroll-contain border-y border-fg/15 bg-background px-l py-l text-m desk:hidden">
          <div className="flex flex-col gap-m">
            <a href={href('/votes/')} className={linkClass} onClick={() => setOpen(false)}>{t.navVotes}</a>
            <a href={href('/members/')} className={linkClass} onClick={() => setOpen(false)}>{t.navMembers}</a>
            <a href={href('/parties/')} className={linkClass} onClick={() => setOpen(false)}>{t.navParties}</a>
          </div>
          <div>
            <div className="mb-s text-s caption opacity-l">{t.appearance}</div>
            <ThemePicker
              value={theme}
              label={t.appearance}
              lightLabel={t.themeLight}
              darkLabel={t.themeDark}
              onChange={onThemeChange}
              expanded
            />
          </div>
          <div>
            <div className="mb-s text-s caption opacity-l">{t.language}</div>
            <LanguagePicker
              locale={locale}
              deHref={deHref}
              enHref={enHref}
              label={t.language}
              germanLabel={t.german}
              englishLabel={t.english}
              expanded
              onSelect={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </nav>
  )
}
