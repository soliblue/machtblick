import { useCallback, useEffect, useState } from 'react'

export type ThemeMode = 'light' | 'dark'

const STORAGE_KEY = 'machtblick.theme'

const applyTheme = (theme: ThemeMode) => {
  const dark = theme === 'dark'
  const color = dark ? '#000000' : '#FFFFFF'
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute('content', color)
  document.querySelector<HTMLMetaElement>('meta[name="msapplication-TileColor"]')?.setAttribute('content', color)
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>('light')

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    const initial = stored === 'dark' ? 'dark' : 'light'
    setTheme(initial)
    applyTheme(initial)
  }, [])

  const selectTheme = useCallback((next: ThemeMode) => {
    window.localStorage.setItem(STORAGE_KEY, next)
    setTheme(next)
    applyTheme(next)
  }, [])

  return { theme, selectTheme }
}
