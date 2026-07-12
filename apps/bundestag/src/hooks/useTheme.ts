import { useCallback, useEffect, useState } from 'react'

export type ThemeMode = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'machtblick.theme'

const applyTheme = (theme: ThemeMode) => {
  const dark = theme === 'dark'
    || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  const color = dark ? '#000000' : '#FFFFFF'
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute('content', color)
  document.querySelector<HTMLMetaElement>('meta[name="msapplication-TileColor"]')?.setAttribute('content', color)
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>('system')

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    const initial = stored === 'light' || stored === 'dark' ? stored : 'system'
    setTheme(initial)
    applyTheme(initial)
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const sync = () => theme === 'system' ? applyTheme(theme) : undefined
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [theme])

  const selectTheme = useCallback((next: ThemeMode) => {
    next === 'system'
      ? window.localStorage.removeItem(STORAGE_KEY)
      : window.localStorage.setItem(STORAGE_KEY, next)
    setTheme(next)
    applyTheme(next)
  }, [])

  return { theme, selectTheme }
}
