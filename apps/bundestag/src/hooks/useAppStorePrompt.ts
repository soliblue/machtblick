import { useCallback, useEffect, useState } from 'react'

const SEEN_KEY = 'machtblick.appStorePrompt.seen'

export function useAppStorePrompt() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const ua = window.navigator.userAgent
    const show = /iPhone/.test(ua)
      && !/Version\/[\d.]+ Mobile\/\S+ Safari\/[\d.]+/.test(ua)
      && window.localStorage.getItem(SEEN_KEY) !== '1'
    const timeout = show ? window.setTimeout(() => {
      window.localStorage.setItem(SEEN_KEY, '1')
      setVisible(true)
    }, 2000) : undefined
    return () => timeout === undefined ? undefined : window.clearTimeout(timeout)
  }, [])

  const dismiss = useCallback(() => setVisible(false), [])

  return { visible, dismiss }
}
