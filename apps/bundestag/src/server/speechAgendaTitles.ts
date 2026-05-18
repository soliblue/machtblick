import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { XMLParser } from 'fast-xml-parser'

type ProtocolRoot = {
  vorspann?: {
    kopfdaten?: {
      veranstaltungsdaten?: {
        datum?: { date?: string }
      }
    }
  }
  sitzungsverlauf?: {
    tagesordnungspunkt?: AgendaTop | AgendaTop[]
  }
}

type AgendaTop = {
  'top-id'?: string
  p?: AgendaParagraph | AgendaParagraph[]
}

type AgendaParagraph = {
  _text?: string
  klasse?: string
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  textNodeName: '_text',
  trimValues: true,
})

let cache: Map<string, string> | null = null

export function speechAgendaTitle(date: string, agendaItem: string | null): string | null {
  return agendaItem ? speechAgendaTitles().get(agendaTitleKey(date, agendaItem)) ?? null : null
}

export function speechAgendaTitles(): Map<string, string> {
  if (!cache) {
    cache = new Map()
    const rawDir = fileURLToPath(new URL('../../../../etl/bundestag-reden-xml/raw/xml/', import.meta.url))
    if (existsSync(rawDir)) {
      for (const file of readdirSync(rawDir).filter((name) => name.endsWith('.xml')).sort()) {
        const root = (parser.parse(readFileSync(join(rawDir, file), 'utf8')) as { dbtplenarprotokoll?: ProtocolRoot }).dbtplenarprotokoll
        const rawDate = root?.vorspann?.kopfdaten?.veranstaltungsdaten?.datum?.date ?? ''
        const [dd, mm, yyyy] = rawDate.split('.')
        const date = dd && mm && yyyy ? `${yyyy}-${mm}-${dd}` : ''
        if (root && date) {
          for (const top of asArray(root.sitzungsverlauf?.tagesordnungspunkt)) {
            const topId = top['top-id']
            const paragraphs = asArray(top.p)
            const bold = paragraphs.filter((p) => p.klasse === 'T_fett').map((p) => cleanTitle(p._text ?? '')).filter(Boolean)
            const title = bold.length
              ? bold.join(': ')
              : paragraphs
                .filter((p) => p.klasse === 'T_NaS')
                .map((p) => cleanTitle(p._text ?? ''))
                .filter(Boolean)
                .slice(0, 2)
                .join(' / ') || null
            if (topId && title) cache.set(agendaTitleKey(date, topId), title)
          }
        }
      }
    }
  }
  return cache
}

export function agendaTitleKey(date: string, agendaItem: string) {
  return `${date}\u0000${agendaItem.replace(/\s+/g, ' ').trim()}`
}

function cleanTitle(value: string) {
  return value
    .replace(/\s+/g, ' ')
    .replace(/^[a-z]\)\s*/i, '')
    .replace(/^-\s*/, '')
    .trim()
}

function asArray<T>(value: T | T[] | undefined): T[] {
  return Array.isArray(value) ? value : value ? [value] : []
}
