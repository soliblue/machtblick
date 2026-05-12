import { useEffect, useState, type CSSProperties } from 'react'

const scrollRange = 140

type EyeMotion = { progress: number; pupilX: number; pupilY: number }
const restingMotion: EyeMotion = { progress: 0, pupilX: 0, pupilY: 0 }

export function ScrollEyeWordmark() {
  const [motion, setMotion] = useState<EyeMotion>(restingMotion)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    const update = () => {
      if (mediaQuery.matches) {
        setMotion(restingMotion)
        return
      }
      const scrollY = window.scrollY
      const progress = clamp(scrollY / scrollRange)
      setMotion({
        progress,
        pupilX: Math.sin(scrollY / 34) * 2.5,
        pupilY: Math.cos(scrollY / 48) * 1.6 + progress * 1.1,
      })
    }
    const requestUpdate = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', requestUpdate, { passive: true })
    mediaQuery.addEventListener('change', update)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', requestUpdate)
      mediaQuery.removeEventListener('change', update)
    }
  }, [])

  const style = {
    '--mb-eye-opacity': motion.progress,
    '--mb-eye-scale': 0.78 + motion.progress * 0.22,
    '--mb-eye-pupil-x': `${motion.pupilX}px`,
    '--mb-eye-pupil-y': `${motion.pupilY}px`,
    '--mb-wordmark-text-opacity': 1 - motion.progress,
    '--mb-wordmark-text-scale': 1 - motion.progress * 0.28,
    '--mb-wordmark-text-x': `${motion.progress * -0.35}rem`,
    '--mb-wordmark-height': `${1.75 - motion.progress * 0.35}rem`,
    '--mb-wordmark-width': `${7 - motion.progress * 4.5}rem`,
  } as CSSProperties

  return (
    <span className="mb-scroll-wordmark" style={style}>
      <span className="mb-scroll-wordmark__text">Machtblick</span>
      <svg aria-hidden="true" className="mb-eye-logo" focusable="false" viewBox="0 0 82 36">
        <path
          d="M8.4 16.8C12.2 12.2 16.3 10.2 21 10.2C27 10.2 31.1 12.7 35 19C31.1 25.3 27 27.8 21 27.8C16.3 27.8 12.2 25.8 8.4 21.2C7.6 20.2 7.6 17.8 8.4 16.8Z"
          fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"
        />
        <path
          d="M73.6 16.8C69.8 12.2 65.7 10.2 61 10.2C55 10.2 50.9 12.7 47 19C50.9 25.3 55 27.8 61 27.8C65.7 27.8 69.8 25.8 73.6 21.2C74.4 20.2 74.4 17.8 73.6 16.8Z"
          fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"
        />
        <g className="mb-eye-logo__brows">
          <path d="M9 3.8C16 1.6 24 1.4 32 3.5" />
          <path d="M50 3.5C58 1.4 66 1.6 73 3.8" />
        </g>
        <g className="mb-eye-logo__pupils">
          <circle cx="21" cy="19" fill="currentColor" r="3.8" />
          <circle cx="61" cy="19" fill="var(--color-danger)" r="3.8" />
        </g>
      </svg>
    </span>
  )
}

function clamp(value: number) {
  return Math.min(1, Math.max(0, value))
}
