import { createContext, useContext, type ReactNode } from 'react'
import type { Locale } from './locale'
import { de } from './copy/de'
import { en } from './copy/en'

export const copy = { de, en } as const

const LocaleContext = createContext<Locale>('de')

type Props = {
  locale: Locale
  children: ReactNode
}

export function LocaleProvider({ locale, children }: Props) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  return useContext(LocaleContext)
}

export function useCopy() {
  return copy[useLocale()]
}
