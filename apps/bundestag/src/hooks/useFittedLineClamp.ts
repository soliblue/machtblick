import { useLayoutEffect, useRef, useState } from 'react'

export function useFittedLineClamp<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [lines, setLines] = useState<number | null>(null)
  useLayoutEffect(() => {
    const el = ref.current!
    const measure = () => {
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight)
      setLines(Math.max(1, Math.floor(el.clientHeight / lineHeight)))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return { ref, lines }
}
