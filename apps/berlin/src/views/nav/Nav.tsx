import { useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'
import { ProductPicker, ThemePicker } from '@machtblick/web-ui'
import type { ThemeMode } from '@/hooks/useTheme'

type Props = {
  theme: ThemeMode
  onThemeChange: (theme: ThemeMode) => void
}

const links = [
  { to: '/', label: 'Erststimme' },
  { to: '/compare/', label: 'Zweitstimme' },
  { to: '/programmes/', label: 'Programme' },
  { to: '/election/', label: 'So wählst du' }
] as const

export function Nav({ theme, onThemeChange }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  return (
    <nav className="sticky top-0 z-50 h-[54px] border-b border-fg/15 bg-background">
      <div className="mx-auto flex h-full max-w-3xl items-center gap-m px-l text-m">
        <ProductPicker current="Berlin" animateBrand={false} />
        <div className="ml-auto hidden items-center gap-l desk:flex">
          {links.map((link) => (
            <Link key={link.to} to={link.to} className={pathname === link.to ? 'font-semibold' : 'opacity-l hover:opacity-100'}>
              {link.label}
            </Link>
          ))}
          <ThemePicker
            value={theme}
            label="Darstellung"
            lightLabel="Hell"
            darkLabel="Dunkel"
            onChange={onThemeChange}
          />
        </div>
        <button
          type="button"
          aria-label={open ? 'Menü schließen' : 'Menü öffnen'}
          onClick={() => setOpen((value) => !value)}
          className="ml-auto desk:hidden"
        >
          {open ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>
      {open ? (
        <div className="absolute inset-x-0 top-full border-b border-fg/15 bg-background px-l py-l desk:hidden">
          <div className="mx-auto flex max-w-3xl flex-col gap-l">
            {links.map((link) => (
              <Link key={link.to} to={link.to} onClick={() => setOpen(false)} className={pathname === link.to ? 'font-semibold' : 'opacity-l'}>
                {link.label}
              </Link>
            ))}
            <ThemePicker
              value={theme}
              label="Darstellung"
              lightLabel="Hell"
              darkLabel="Dunkel"
              onChange={onThemeChange}
              expanded
            />
          </div>
        </div>
      ) : null}
    </nav>
  )
}
