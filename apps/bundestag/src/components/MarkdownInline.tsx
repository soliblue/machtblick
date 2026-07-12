import type { ReactNode } from 'react'

type Props = { children: string }

type TextItem = { kind: 'text'; text: string }
type NodeItem = { kind: 'node'; node: ReactNode }
type DelimItem = { kind: 'delim'; count: number; origLen: number; canOpen: boolean; canClose: boolean }
type Item = TextItem | NodeItem | DelimItem

const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g
const PUNCT = /[\p{P}\p{S}]/u
const SAFE_HREF = /^(https?:|\/|\.\/|#)/i

function linkPass(text: string, keys: { n: number }): Item[] {
  const items: Item[] = []
  let last = 0
  for (const m of text.matchAll(LINK)) {
    if (m.index > last) items.push({ kind: 'text', text: text.slice(last, m.index) })
    items.push({
      kind: 'node',
      node: SAFE_HREF.test(m[2]) ? (
        <a key={keys.n++} href={m[2]} target="_blank" rel="noreferrer" className="underline">
          {m[1]}
        </a>
      ) : (
        <span key={keys.n++}>{m[1]}</span>
      ),
    })
    last = m.index + m[0].length
  }
  if (last < text.length) items.push({ kind: 'text', text: text.slice(last) })
  return items
}

function delimPass(items: Item[]): Item[] {
  const out: Item[] = []
  items.forEach((item, i) => {
    if (item.kind !== 'text') {
      out.push(item)
      return
    }
    const edgeBefore = i > 0 ? 'a' : ''
    const edgeAfter = i < items.length - 1 ? 'a' : ''
    const text = item.text
    let last = 0
    for (const m of text.matchAll(/\*+/g)) {
      if (m.index > last) out.push({ kind: 'text', text: text.slice(last, m.index) })
      const before = m.index > 0 ? text[m.index - 1] : edgeBefore
      const after = m.index + m[0].length < text.length ? text[m.index + m[0].length] : edgeAfter
      const beforeWs = before === '' || /\s/.test(before)
      const afterWs = after === '' || /\s/.test(after)
      const beforePunct = before !== '' && PUNCT.test(before)
      const afterPunct = after !== '' && PUNCT.test(after)
      out.push({
        kind: 'delim',
        count: m[0].length,
        origLen: m[0].length,
        canOpen: !afterWs && (!afterPunct || beforeWs || beforePunct),
        canClose: !beforeWs && (!beforePunct || afterWs || afterPunct),
      })
      last = m.index + m[0].length
    }
    if (last < text.length) out.push({ kind: 'text', text: text.slice(last) })
  })
  return out
}

function toNodes(items: Item[]): ReactNode[] {
  return items.map((item) => (item.kind === 'text' ? item.text : item.kind === 'node' ? item.node : '*'.repeat(item.count)))
}

function processEmphasis(items: Item[], keys: { n: number }): void {
  let closerIdx = 0
  while (closerIdx < items.length) {
    const closer = items[closerIdx]
    if (closer.kind !== 'delim' || !closer.canClose || closer.count === 0) {
      closerIdx++
      continue
    }
    let openerIdx = -1
    for (let i = closerIdx - 1; i >= 0; i--) {
      const candidate = items[i]
      if (candidate.kind !== 'delim' || !candidate.canOpen || candidate.count === 0) continue
      const blocked =
        (candidate.canClose || closer.canOpen) &&
        (candidate.origLen + closer.origLen) % 3 === 0 &&
        (candidate.origLen % 3 !== 0 || closer.origLen % 3 !== 0)
      if (!blocked) {
        openerIdx = i
        break
      }
    }
    if (openerIdx === -1) {
      if (!closer.canOpen) items[closerIdx] = { kind: 'text', text: '*'.repeat(closer.count) }
      closerIdx++
      continue
    }
    const opener = items[openerIdx] as DelimItem
    const use = opener.count > 1 && closer.count > 1 ? 2 : 1
    opener.count -= use
    closer.count -= use
    const inner = toNodes(items.slice(openerIdx + 1, closerIdx))
    const wrapped: Item = {
      kind: 'node',
      node:
        use === 2 ? (
          <strong key={keys.n++} className="font-semibold">
            {inner}
          </strong>
        ) : (
          <em key={keys.n++} className="italic">
            {inner}
          </em>
        ),
    }
    items.splice(openerIdx + 1, closerIdx - openerIdx - 1, wrapped)
    closerIdx = openerIdx + 2
    if (closer.count === 0) items.splice(closerIdx, 1)
    if (opener.count === 0) {
      items.splice(openerIdx, 1)
      closerIdx--
    }
  }
}

export function MarkdownInline({ children }: Props) {
  const keys = { n: 0 }
  const items = delimPass(linkPass(children.replace(/\u0000/g, '\uFFFD').trim(), keys))
  processEmphasis(items, keys)
  return <>{toNodes(items)}</>
}
