import { Fragment, type ReactNode } from 'react'

export function renderSnippet(snippet: string): ReactNode {
  const parts = snippet.split(/<<<(.*?)>>>/g)
  return parts.map((p, i) =>
    i % 2 === 1
      ? <mark key={i} style={{ background: 'color-mix(in oklab, gold 45%, transparent)', color: 'inherit' }}>{p}</mark>
      : <Fragment key={i}>{p}</Fragment>,
  )
}
