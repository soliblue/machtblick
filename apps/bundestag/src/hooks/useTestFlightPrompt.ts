import { useCallback, useEffect, useState } from 'react'

const SEEN_KEY = 'machtblick.testFlightPrompt.seen'

export function useTestFlightPrompt() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const ua = window.navigator.userAgent
    const show = window.navigator.vendor === 'Apple Computer, Inc.'
      && /iPhone/.test(ua)
      && /Version\/[\d.]+ Mobile\/\S+ Safari\/[\d.]+/.test(ua)
      && !/(CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|GSA|YaApp_iOS|FBAN|FBAV|Instagram|Line|Mercury|UCBrowser|OPT\/|OPR\/|Brave|Chrome|Firefox|Edge|Opera|SamsungBrowser)/.test(ua)
      && window.localStorage.getItem(SEEN_KEY) !== '1'
    if (show) {
      window.localStorage.setItem(SEEN_KEY, '1')
      setVisible(true)
    }
  }, [])

  const dismiss = useCallback(() => setVisible(false), [])

  return { visible, dismiss }
}
