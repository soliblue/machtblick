import { XMLParser } from 'fast-xml-parser'

export type ParsedAgendaItem = {
  sessionId: string
  date: string
  agendaItem: string
  sourceTitle: string
  title: string
  sourceUrl: string
}

type ProtocolRoot = {
  vorspann?: {
    kopfdaten?: {
      'plenarprotokoll-nummer'?: {
        sitzungsnr?: string | number
      }
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

export function parseAgendaProtocol(xml: string): ParsedAgendaItem[] {
  const root = (parser.parse(xml) as { dbtplenarprotokoll?: ProtocolRoot }).dbtplenarprotokoll
  const sessionNumber = Number(root?.vorspann?.kopfdaten?.['plenarprotokoll-nummer']?.sitzungsnr ?? 0)
  const date = parseGermanDate(root?.vorspann?.kopfdaten?.veranstaltungsdaten?.datum?.date ?? '')
  const sourceUrl = sessionNumber ? `https://dserver.bundestag.de/btp/21/21${String(sessionNumber).padStart(3, '0')}.xml` : ''
  return root && sessionNumber && date
    ? asArray(root.sitzungsverlauf?.tagesordnungspunkt).map((top) => agendaItem(top, `21-${sessionNumber}`, date, sourceUrl)).filter((item): item is ParsedAgendaItem => Boolean(item))
    : []
}

function agendaItem(top: AgendaTop, sessionId: string, date: string, sourceUrl: string): ParsedAgendaItem | null {
  const agendaItem = top['top-id']
  const paragraphs = asArray(top.p)
  const bold = paragraphs.filter((p) => p.klasse === 'T_fett').map((p) => p._text ?? '').filter(Boolean)
  const fallback = paragraphs.filter((p) => p.klasse === 'T_NaS').map((p) => p._text ?? '').filter(Boolean).slice(0, 2)
  const sourceTitle = (bold.length ? bold : fallback).join(bold.length ? ': ' : ' / ')
  const title = cleanTitle(sourceTitle)
  return agendaItem && title ? { sessionId, date, agendaItem, sourceTitle, title, sourceUrl } : null
}

function cleanTitle(value: string) {
  return value
    .replace(/\s+/g, ' ')
    .replace(/^[a-z]\)\s*/i, '')
    .replace(/^-\s*/, '')
    .trim()
}

function parseGermanDate(raw: string) {
  const match = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  return match ? `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}` : ''
}

function asArray<T>(value: T | T[] | undefined): T[] {
  return Array.isArray(value) ? value : value ? [value] : []
}
