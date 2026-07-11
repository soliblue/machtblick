import { useEffect, useId, useRef, useState } from 'react'
import { Info } from 'lucide-react'
import { initials } from '@/lib/initials'
import { useCopy } from '@/lib/i18n'

type Props = {
  name: string
  pictureUrl: string | null
  pictureAuthor: string | null
  pictureLicense: string | null
  pictureSourceUrl: string | null
}

export function MemberPortrait({ name, pictureUrl, pictureAuthor, pictureLicense, pictureSourceUrl }: Props) {
  const t = useCopy()
  const [creditOpen, setCreditOpen] = useState(false)
  const creditId = useId()
  const creditRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (creditOpen) {
      const onPointerDown = (event: PointerEvent) => {
        if (!creditRef.current?.contains(event.target as Node)) setCreditOpen(false)
      }
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') setCreditOpen(false)
      }
      document.addEventListener('pointerdown', onPointerDown)
      document.addEventListener('keydown', onKeyDown)
      return () => {
        document.removeEventListener('pointerdown', onPointerDown)
        document.removeEventListener('keydown', onKeyDown)
      }
    }
  }, [creditOpen])
  return (
    <div className="relative size-[112px] shrink-0 desk:size-[128px]">
      {pictureUrl ? (
        <img src={pictureUrl} alt={name} className="h-[112px] w-[112px] rounded-full object-cover desk:h-[128px] desk:w-[128px]" />
      ) : (
        <div className="flex h-[112px] w-[112px] items-center justify-center rounded-full bg-surface text-xl font-semibold opacity-m desk:h-[128px] desk:w-[128px]">
          {initials(name)}
        </div>
      )}
      {pictureUrl && pictureAuthor && pictureLicense && (
        <div
          ref={creditRef}
          className="absolute bottom-0 right-0 z-20"
          onMouseEnter={() => setCreditOpen(true)}
          onMouseLeave={() => setCreditOpen(false)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setCreditOpen(false)
          }}
        >
          <button
            type="button"
            aria-label={`${t.photo}: ${pictureAuthor}, ${pictureLicense}`}
            aria-controls={creditId}
            aria-expanded={creditOpen}
            aria-haspopup="dialog"
            onClick={() => setCreditOpen(true)}
            onFocus={() => setCreditOpen(true)}
            className="flex size-8 items-center justify-center rounded-full border border-fg/15 bg-background shadow-sm transition-opacity hover:opacity-80"
          >
            <Info size={14} aria-hidden="true" />
          </button>
          {creditOpen ? (
            <div
              id={creditId}
              role="dialog"
              aria-label={`${t.photo}: ${pictureAuthor}, ${pictureLicense}`}
              className="absolute left-0 top-full z-50 mt-s rounded-m border border-fg/15 bg-background px-m py-s text-s shadow-lg"
              style={{ width: 'min(280px, calc(100vw - 2 * var(--spacing-l)))', overflowWrap: 'anywhere' }}
            >
            {pictureSourceUrl ? (
              <a href={pictureSourceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                {t.photo}: {pictureAuthor}, {pictureLicense}
              </a>
            ) : (
              <span>{t.photo}: {pictureAuthor}, {pictureLicense}</span>
            )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
