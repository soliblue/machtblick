import { useEffect, useRef, useState } from 'react'

export function useNearViewport<T extends HTMLElement>(eager: boolean) {
  const ref = useRef<T>(null)
  const [seen, setSeen] = useState(false)
  const near = eager || seen
  useEffect(() => {
    if (near || !ref.current) return
    const observer = new IntersectionObserver(
      (entries) => entries.some((entry) => entry.isIntersecting) && setSeen(true),
      { rootMargin: '1500px' },
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [near])
  return { ref, near }
}
