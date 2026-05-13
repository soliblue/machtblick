import { useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'

const KEY = 'mb:scroll:'

export function useScrollRestore() {
  const router = useRouter()
  useEffect(() => {
    if (typeof window === 'undefined') return
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'
    const save = () => {
      const k = KEY + window.location.pathname + window.location.search
      sessionStorage.setItem(k, String(window.scrollY))
    }
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(save)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    const restore = () => {
      const k = KEY + window.location.pathname + window.location.search
      const saved = sessionStorage.getItem(k)
      const y = saved ? Number(saved) : 0
      let tries = 0
      const tick = () => {
        window.scrollTo(0, y)
        if (Math.abs(window.scrollY - y) > 2 && tries++ < 30) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }
    const unsub = router.subscribe('onResolved', () => {
      restore()
    })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
      unsub()
    }
  }, [router])
}
