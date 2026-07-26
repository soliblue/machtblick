import { useState } from 'react'
import { Info } from 'lucide-react'

type Props = {
  name: string
  imageUrl: string | null
  sourceUrl?: string | null
  publisher?: string | null
  author?: string | null
  license?: string | null
  licenseUrl?: string | null
  variant?: 'detail' | 'card'
}

export function CandidatePortrait({
  name,
  imageUrl,
  sourceUrl = null,
  publisher = null,
  author = null,
  license = null,
  licenseUrl = null,
  variant = 'detail'
}: Props) {
  const [failed, setFailed] = useState(false)
  const words = name.split(/\s+/).filter((word) => !word.endsWith('.'))
  const compact = variant === 'card'
  return (
    <div className={`relative shrink-0 ${compact ? 'size-16' : 'size-[112px] desk:size-[128px]'}`}>
      {imageUrl && !failed ? (
        <img
          src={imageUrl}
          alt={name}
          loading={compact ? 'lazy' : 'eager'}
          fetchPriority={compact ? 'auto' : 'high'}
          decoding="async"
          onError={() => setFailed(true)}
          className={`size-full rounded-full bg-surface object-cover ${compact ? '' : 'border border-fg/15'}`}
        />
      ) : (
        <div
          aria-hidden="true"
          className={`flex size-full items-center justify-center rounded-full border border-fg/15 bg-surface font-display font-semibold uppercase opacity-l ${compact ? 'text-l' : 'text-[40px]'}`}
        >
          {words.length > 1
            ? `${words[0]?.[0] ?? ''}${words.at(-1)?.[0] ?? ''}`
            : name.slice(0, 2)}
        </div>
      )}
      {!compact && imageUrl && sourceUrl ? (
        <details className="group absolute bottom-0 right-0 z-20">
          <summary
            aria-label={`Bildnachweis für ${name}`}
            className="flex size-8 cursor-pointer list-none items-center justify-center rounded-full border border-fg/15 bg-background shadow-sm transition-opacity hover:opacity-80 [&::-webkit-details-marker]:hidden"
          >
            <Info size={14} aria-hidden="true" />
          </summary>
          <div
            className="absolute left-0 top-full z-50 mt-s grid gap-xs rounded-m border border-fg/15 bg-background px-m py-s text-s shadow-lg"
            style={{ width: 'min(280px, calc(100vw - 2 * var(--spacing-l)))', overflowWrap: 'anywhere' }}
          >
            <a href={sourceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">
              Bildquelle{publisher ? `: ${publisher}` : ''}
            </a>
            {author ? <span>Foto: {author}</span> : null}
            {license ? (
              licenseUrl ? (
                <a href={licenseUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                  Lizenz: {license}
                </a>
              ) : <span>Lizenz: {license}</span>
            ) : null}
          </div>
        </details>
      ) : null}
    </div>
  )
}
