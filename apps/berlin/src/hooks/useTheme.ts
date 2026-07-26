import { useCallback, useEffect, useState } from 'react'

export type ThemeMode = 'light' | 'dark'

function applyTheme(theme: ThemeMode) {
  const dark = theme === 'dark'
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute('content', dark ? '#000000' : '#FFFFFF')
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>('light')

  useEffect(() => {
    const stored = window.localStorage.getItem('machtblick.theme')
    const initial = stored === 'dark' ? 'dark' : 'light'
    setTheme(initial)
    applyTheme(initial)
  }, [])

  const selectTheme = useCallback((next: ThemeMode) => {
    window.localStorage.setItem('machtblick.theme', next)
    setTheme(next)
    applyTheme(next)
  }, [])

  return { theme, selectTheme }
}
