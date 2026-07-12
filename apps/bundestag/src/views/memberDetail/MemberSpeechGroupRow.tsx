import type { CSSProperties } from 'react'
import { ChevronRight, ExternalLink } from 'lucide-react'
import { formatDateShort } from '@/lib/format'
import { SERIF } from '@/lib/fonts'
import { highlight } from '@/components/highlight'
import { PARTY_COLOR } from '@/lib/parties'
import { renderSnippet } from '@/components/snippet'
import { withLocale } from '@/lib/locale'
import { useCopy, useLocale } from '@/lib/i18n'
import { memberSpeechGroupTitle, type MemberSpeechGroup } from '@/lib/memberSpeechGroups'

const ROW_BORDER = 'color-mix(in oklab, var(--color-fg) 8%, transparent)'

type Props = {
  group: MemberSpeechGroup
  terms: string[]
  preview: { body: string; snippet: string | null }
  onOpen: () => void
}

export function MemberSpeechGroupRow({ group, terms, preview, onOpen }: Props) {
  const locale = useLocale()
  const t = useCopy()
  const color = PARTY_COLOR[group.main.party ?? ''] ?? null
  const title = memberSpeechGroupTitle(group, locale === 'en' ? 'Speech' : 'Rede')
  const shortLabel = group.shortCount > 0
    ? locale === 'en'
      ? `${group.shortCount} short`
      : `${group.shortCount} kurz`
    : null
  return (
    <article className="border-t py-m" style={{ borderColor: ROW_BORDER }}>
      <div className="grid gap-s desk:grid-cols-[minmax(0,1fr)_auto] desk:items-start">
        <h2 className="font-display text-l font-semibold leading-tight" style={{ overflowWrap: 'anywhere' }}>
          {highlight(title, terms)}
        </h2>
        <div className="text-s caption opacity-l desk:pt-xs">{formatDateShort(group.date, locale)}</div>
      </div>
      <div className="mt-s flex flex-wrap items-center gap-x-s gap-y-xs text-s caption opacity-l">
        <span>{group.speeches.length} {group.speeches.length === 1 ? t.contribution : t.contributions}</span>
        {shortLabel && (
          <>
            <span aria-hidden="true">/</span>
            <span>{shortLabel}</span>
          </>
        )}
        {group.voteId && (
          <>
            <span aria-hidden="true">/</span>
            <a
              href={withLocale(`/votes/${group.voteId}/`, locale)}
              className="relative z-10 inline-flex items-center gap-xs hover:opacity-100"
            >
              {t.toVote}
              <ExternalLink size={14} aria-hidden="true" />
            </a>
          </>
        )}
      </div>
      <div
        className={`${color ? 'party-surface' : 'party-surface-neutral'} mt-m rounded-m p-m text-m line-clamp-3`}
        style={{
          '--party-color': color ?? 'var(--color-fg)',
          fontFamily: SERIF,
          lineHeight: 1.45,
        } as CSSProperties}
      >
        {preview.snippet ? renderSnippet(preview.snippet) : highlight(preview.body, terms)}
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="mt-s inline-flex items-center gap-xs text-s font-semibold transition-opacity hover:opacity-70"
      >
        <span>{t.viewFullDebate}</span>
        <ChevronRight size={17} aria-hidden="true" />
      </button>
    </article>
  )
}
