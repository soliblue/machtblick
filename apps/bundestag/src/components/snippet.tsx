import { Fragment, type ReactNode } from 'react'

const SNIPPET_RADIUS = 24

export function renderSnippet(snippet: string): ReactNode {
  const parts = snippet.split(/<<<(.*?)>>>/g)
  return parts.map((p, i) =>
    i % 2 === 1
      ? <mark key={i} style={{ background: 'color-mix(in oklab, gold 45%, transparent)', color: 'inherit' }}>{p}</mark>
      : <Fragment key={i}>{p}</Fragment>,
  )
}

export function makeSnippet(text: string, terms: string[]): string | null {
  if (!terms.length) return null
  const lower = text.toLowerCase()
  let firstIdx = -1
  let matchLen = 0
  for (const t of terms) {
    const i = lower.indexOf(t)
    if (i >= 0 && (firstIdx < 0 || i < firstIdx)) {
      firstIdx = i
      matchLen = t.length
    }
  }
  if (firstIdx < 0) return null
  const start = Math.max(0, firstIdx - SNIPPET_RADIUS)
  const end = Math.min(text.length, firstIdx + matchLen + SNIPPET_RADIUS)
  const pre = start > 0 ? '…' : ''
  const post = end < text.length ? '…' : ''
  return `${pre}${text.slice(start, firstIdx)}<<<${text.slice(firstIdx, firstIdx + matchLen)}>>>${text.slice(firstIdx + matchLen, end)}${post}`
}
