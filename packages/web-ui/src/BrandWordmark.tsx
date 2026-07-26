import { useEffect, useState, type CSSProperties } from 'react'

type Motion = {
  progress: number
  pupilX: number
  pupilY: number
}

const restingMotion: Motion = { progress: 0, pupilX: 0, pupilY: 0 }

type Props = {
  animated?: boolean
}

export function BrandWordmark({ animated = true }: Props) {
  const [motion, setMotion] = useState<Motion>(restingMotion)

  useEffect(() => {
    if (animated) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      let frame = 0
      const update = () => {
        if (mediaQuery.matches) {
          setMotion(restingMotion)
        } else {
          const progress = Math.min(1, Math.max(0, window.scrollY / 140))
          setMotion({
            progress,
            pupilX: Math.sin(window.scrollY / 34) * 2.5,
            pupilY: Math.cos(window.scrollY / 48) * 1.6 + progress * 1.1,
          })
        }
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
    }
    setMotion(restingMotion)
    return undefined
  }, [animated])

  return (
    <span
      className="mb-brand-wordmark"
      style={{
        '--mb-eye-opacity': motion.progress,
        '--mb-eye-scale': 0.78 + motion.progress * 0.22,
        '--mb-eye-pupil-x': `${motion.pupilX}px`,
        '--mb-eye-pupil-y': `${motion.pupilY}px`,
        '--mb-wordmark-text-opacity': 1 - motion.progress,
        '--mb-wordmark-text-scale': 1 - motion.progress * 0.28,
        '--mb-wordmark-text-x': `${motion.progress * -0.35}rem`,
        '--mb-wordmark-height': `${1.75 - motion.progress * 0.35}rem`,
        '--mb-wordmark-width': `${7 - motion.progress * 4.5}rem`,
      } as CSSProperties}
    >
      <span className="mb-brand-wordmark__text">Machtblick</span>
      <svg aria-hidden="true" className="mb-brand-eye" focusable="false" viewBox="0 0 82 36">
        <path
          d="M8.4 16.8C12.2 12.2 16.3 10.2 21 10.2C27 10.2 31.1 12.7 35 19C31.1 25.3 27 27.8 21 27.8C16.3 27.8 12.2 25.8 8.4 21.2C7.6 20.2 7.6 17.8 8.4 16.8Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
        />
        <path
          d="M73.6 16.8C69.8 12.2 65.7 10.2 61 10.2C55 10.2 50.9 12.7 47 19C50.9 25.3 55 27.8 61 27.8C65.7 27.8 69.8 25.8 73.6 21.2C74.4 20.2 74.4 17.8 73.6 16.8Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
        />
        <g className="mb-brand-eye__brows">
          <path d="M9 3.8C16 1.6 24 1.4 32 3.5" />
          <path d="M50 3.5C58 1.4 66 1.6 73 3.8" />
        </g>
        <g className="mb-brand-eye__pupils">
          <circle cx="21" cy="19" fill="currentColor" r="3.8" />
          <circle cx="61" cy="19" fill="var(--color-danger)" r="3.8" />
        </g>
      </svg>
    </span>
  )
}
