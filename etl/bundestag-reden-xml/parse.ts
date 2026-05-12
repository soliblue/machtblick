import { XMLParser } from 'fast-xml-parser'

export type SpeechRow = {
  id: string
  sessionId: string
  agendaItem: string | null
  speakerDipId: string | null
  speakerTitel: string | null
  speakerVorname: string
  speakerNachname: string
  speakerNamenszusatz: string | null
  speakerRoleLang: string | null
  speakerRoleKurz: string | null
  speakerFraktion: string | null
  speakerName: string
  date: string
  position: number
  textFull: string
  sourceUrl: string
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  textNodeName: '_text',
  preserveOrder: true,
  trimValues: false,
})

const SPEECH_P_CLASSES = new Set(['J', 'J_1', 'O'])

export function parseProtocol(xml: string): SpeechRow[] {
  const tree = parser.parse(xml) as Node[]
  const root = findNode(tree, 'dbtplenarprotokoll')
  if (!root) return []

  const sitzungsnr = String(findText(root, ['vorspann', 'kopfdaten', 'plenarprotokoll-nummer', 'sitzungsnr']))
  const sessionId = `21-${Number(sitzungsnr)}`
  const datumNode = findFirst(root, 'datum')
  const dateRaw = datumNode ? attr(datumNode, 'date') : ''
  const [dd, mm, yyyy] = dateRaw.split('.')
  const date = `${yyyy}-${mm}-${dd}`
  const padded = String(Number(sitzungsnr)).padStart(3, '0')
  const sourceUrl = `https://dserver.bundestag.de/btp/21/21${padded}.xml`

  const verlauf = findChild(root, 'sitzungsverlauf')
  if (!verlauf) return []

  const rows: SpeechRow[] = []
  let position = 0

  for (const top of childrenNamed(verlauf, 'tagesordnungspunkt')) {
    const agendaItem = attr(top, 'top-id') || null
    for (const rede of childrenNamed(top, 'rede')) {
      const segments = splitRedeBySpeaker(rede)
      const rid = attr(rede, 'id')
      for (const segment of segments) {
        position++
        rows.push({
          id: segments.length > 1 ? `${rid}-p${segment.index}` : rid,
          sessionId,
          agendaItem,
          speakerDipId: segment.speaker.dipId,
          speakerTitel: segment.speaker.titel,
          speakerVorname: segment.speaker.vorname,
          speakerNachname: segment.speaker.nachname,
          speakerNamenszusatz: segment.speaker.namenszusatz,
          speakerRoleLang: segment.speaker.roleLang,
          speakerRoleKurz: segment.speaker.roleKurz,
          speakerFraktion: segment.speaker.fraktion,
          speakerName: segment.speaker.displayName,
          date,
          position,
          textFull: segment.text,
          sourceUrl,
        })
      }
    }
  }
  return rows
}

type Node = Record<string, unknown>

type Speaker = {
  dipId: string | null
  titel: string | null
  vorname: string
  nachname: string
  namenszusatz: string | null
  roleLang: string | null
  roleKurz: string | null
  fraktion: string | null
  displayName: string
}

type Segment = { speaker: Speaker; text: string; continuation: boolean; index: number }

function splitRedeBySpeaker(rede: Node): Segment[] {
  const items = (rede[':@'] ? rede : rede) as Node
  const kids = childItems(rede)
  const segments: Segment[] = []
  let current: { speaker: Speaker | null; paragraphs: string[]; continuation: boolean } = { speaker: null, paragraphs: [], continuation: false }
  let segIndex = 0

  for (const item of kids) {
    const tag = tagOf(item)
    if (tag === 'p' && pClass(item) === 'redner') {
      flush()
      const rednerNode = childByTag(item, 'redner')
      current = { speaker: rednerNode ? speakerFromRedner(rednerNode) : speakerFromName(textOfP(item)), paragraphs: [], continuation: false }
      continue
    }
    if (tag === 'name') {
      flush()
      current = { speaker: speakerFromName(textOf(item)), paragraphs: [], continuation: true }
      continue
    }
    if (tag === 'p' && SPEECH_P_CLASSES.has(pClass(item) ?? '')) {
      current.paragraphs.push(stripInline(textOfP(item)))
      continue
    }
  }
  flush()
  return segments

  function flush() {
    if (!current.speaker) return
    if (current.paragraphs.length === 0) return
    segIndex++
    segments.push({
      speaker: current.speaker,
      text: current.paragraphs.join('\n\n').trim(),
      continuation: current.continuation,
      index: segIndex,
    })
  }
}

function speakerFromRedner(redner: Node): Speaker {
  const dipId = attr(redner, 'id') || null
  const name = childByTag(redner, 'name')
  const titel = name ? textOf(childByTag(name, 'titel')) || null : null
  const vorname = dedupeRepeat((name ? textOf(childByTag(name, 'vorname')) : '') || '')
  const nachname = dedupeRepeat((name ? textOf(childByTag(name, 'nachname')) : '') || '')
  const namenszusatz = (name ? textOf(childByTag(name, 'namenszusatz')) : '') || null
  const fraktion = dedupeRepeat((name ? textOf(childByTag(name, 'fraktion')) : '') || '').replace(/\s+/g, ' ').trim() || null
  const rolle = name ? childByTag(name, 'rolle') : null
  const roleLang = rolle ? textOf(childByTag(rolle, 'rolle_lang')) || null : null
  const roleKurz = rolle ? textOf(childByTag(rolle, 'rolle_kurz')) || null : null
  const displayName = [titel, vorname, nachname, namenszusatz].filter(Boolean).join(' ').trim()
  return { dipId, titel, vorname, nachname, namenszusatz, roleLang, roleKurz, fraktion, displayName }
}

function speakerFromName(raw: string): Speaker {
  const clean = raw.replace(/:\s*$/, '').trim()
  const tokens = clean.split(/\s+/)
  const roleWords = ['Präsident', 'Präsidentin', 'Vizepräsident', 'Vizepräsidentin', 'Alterspräsident', 'Alterspräsidentin']
  const isRole = roleWords.includes(tokens[0])
  const role = isRole ? tokens[0] : null
  const nameTokens = isRole ? tokens.slice(1) : tokens
  const nachname = nameTokens[nameTokens.length - 1] ?? ''
  const vorname = nameTokens.slice(0, -1).join(' ')
  return {
    dipId: null,
    titel: null,
    vorname,
    nachname,
    namenszusatz: null,
    roleLang: role,
    roleKurz: role,
    fraktion: null,
    displayName: clean,
  }
}

function findNode(tree: Node[], tag: string): Node | null {
  for (const n of tree) if (tagOf(n) === tag) return n
  return null
}

function findChild(node: Node, tag: string): Node | null {
  for (const c of childItems(node)) if (tagOf(c) === tag) return c
  return null
}

function findFirst(node: Node, tag: string): Node | null {
  const stack: Node[] = [node]
  while (stack.length) {
    const cur = stack.pop()!
    for (const c of childItems(cur)) {
      if (tagOf(c) === tag) return c
      stack.push(c)
    }
  }
  return null
}

function findText(node: Node, path: string[]): string {
  let cur: Node | null = node
  for (const p of path) {
    if (!cur) return ''
    cur = findFirst(cur, p)
  }
  return cur ? textOf(cur) : ''
}

function childItems(node: Node): Node[] {
  const tag = tagOf(node)
  if (!tag) return []
  const arr = node[tag]
  return Array.isArray(arr) ? (arr as Node[]) : []
}

function childrenNamed(node: Node, tag: string): Node[] {
  return childItems(node).filter((c) => tagOf(c) === tag)
}

function childByTag(node: Node | null, tag: string): Node | null {
  if (!node) return null
  for (const c of childItems(node)) if (tagOf(c) === tag) return c
  return null
}

function tagOf(node: Node): string {
  for (const k of Object.keys(node)) if (k !== ':@' && k !== '_text') return k
  return ''
}

function attr(node: Node, name: string): string {
  const a = node[':@'] as Record<string, unknown> | undefined
  return a ? String(a[name] ?? '') : ''
}

function pClass(node: Node): string | null {
  return attr(node, 'klasse') || null
}

function textOf(node: Node | null): string {
  if (!node) return ''
  if (typeof node === 'string') return node
  const tag = tagOf(node)
  if (!tag) return ''
  const arr = node[tag] as Node[] | undefined
  if (!Array.isArray(arr)) return ''
  let out = ''
  for (const item of arr) {
    if (item._text != null) out += String(item._text)
    else if (tagOf(item)) out += textOf(item)
  }
  return out
}

function textOfP(node: Node): string {
  const tag = tagOf(node)
  const arr = node[tag] as Node[] | undefined
  if (!Array.isArray(arr)) return ''
  let out = ''
  for (const item of arr) {
    if (item._text != null) out += String(item._text)
    else if (tagOf(item) === 'redner') continue
    else if (tagOf(item)) out += textOf(item)
  }
  return out
}

function stripInline(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}

function dedupeRepeat(s: string): string {
  const n = s.length
  return n > 1 && n % 2 === 0 && s.slice(0, n / 2) === s.slice(n / 2) ? s.slice(0, n / 2) : s
}
