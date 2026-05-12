import { Fragment, type ReactNode } from 'react'

export function tokenize(query: string): string[] {
  return query.trim().toLowerCase().split(/\s+/).filter(Boolean)
}

export function containsAny(text: string, terms: string[]): boolean {
  const lower = text.toLowerCase()
  return terms.some((t) => lower.includes(t))
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function highlight(text: string, terms: string[]): ReactNode {
  if (!terms.length) return text
  const re = new RegExp(`(${terms.map(escapeRegex).join('|')})`, 'gi')
  const parts = text.split(re)
  return parts.map((p, i) => {
    const isMatch = i % 2 === 1
    return isMatch
      ? <mark key={i} style={{ background: 'color-mix(in oklab, gold 45%, transparent)', color: 'inherit' }}>{p}</mark>
      : <Fragment key={i}>{p}</Fragment>
  })
}
