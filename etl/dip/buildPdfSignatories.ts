import { db } from '@machtblick/db/client'
import { sql } from 'drizzle-orm'
import type { SignatoryRow } from './buildSignatories.ts'

export type AntragForPdfSignatures = {
  id?: number
  initiativeFraktion?: string | null
  introducedDate?: string | null
  drucksache?: string | null
  drucksachePdfUrl?: string | null
}

type MemberCandidate = {
  id: string
  name: string
  firstName: string
  lastName: string
  dipPersonId: number
  party: string
  validFrom: string
  validTo: string | null
}

const FRACTION_PARTIES = new Set(['CDU/CSU', 'SPD', 'B90/Grüne', 'Die Linke', 'AfD'])
const TERM_START = '2025-03-25'

const members = db.all(sql`
  SELECT
    m.id,
    m.name,
    m.first_name as firstName,
    m.last_name as lastName,
    m.dip_person_id as dipPersonId,
    a.party,
    a.valid_from as validFrom,
    a.valid_to as validTo
  FROM members m
  JOIN member_affiliations a ON a.member_id = m.id AND a.term_id = 21
  WHERE m.dip_person_id IS NOT NULL
`) as MemberCandidate[]

const membersByName = new Map<string, MemberCandidate[]>()
for (const member of members) {
  for (const name of [member.name, `${member.firstName} ${member.lastName}`]) {
    const key = normalizeName(name)
    const list = membersByName.get(key) ?? []
    list.push(member)
    membersByName.set(key, list)
  }
}

export async function buildPdfSignatoryRows(
  antraege: AntragForPdfSignatures[],
  existingRows: SignatoryRow[],
) {
  const existingIds = new Set(existingRows.map((row) => row.targetId))
  const rows: SignatoryRow[] = []
  const seen = new Set(existingRows.map((row) => `${row.targetId}|${row.memberId}`))
  for (const antrag of antraege) {
    const parties = initiativeParties(antrag.initiativeFraktion)
    if (!antrag.id || existingIds.has(antrag.id) || parties.size === 0 || !antrag.drucksachePdfUrl) continue
    const names = extractSignatureNames(await extractPdfText(antrag.drucksachePdfUrl))
    const effectiveDate = maxDate(antrag.introducedDate ?? TERM_START, TERM_START)
    for (const name of names) {
      const member = resolveMember(name, parties, effectiveDate)
      if (!member) continue
      const key = `${antrag.id}|${member.id}`
      if (seen.has(key)) continue
      seen.add(key)
      rows.push({ kind: 'antrag', targetId: antrag.id, memberId: member.id, dipPersonId: member.dipPersonId })
    }
  }
  return rows
}

function initiativeParties(value: string | null | undefined) {
  return new Set(
    (value ?? '')
      .split(',')
      .map((part) => part.trim())
      .filter((part) => FRACTION_PARTIES.has(part)),
  )
}

async function extractPdfText(url: string) {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const res = await fetch(url)
  if (!res.ok) return ''
  const contentType = res.headers.get('content-type') ?? ''
  const bytes = new Uint8Array(await res.arrayBuffer())
  const head = new TextDecoder().decode(bytes.slice(0, 5))
  if (!contentType.includes('pdf') && head !== '%PDF-') return ''
  if (head !== '%PDF-') return ''
  const doc = await getDocument({ data: bytes, verbosity: 0 }).promise
  const pages: string[] = []
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p)
    const text = await page.getTextContent()
    pages.push(text.items.map((item) => 'str' in item && typeof item.str === 'string' ? item.str : '').join(' '))
  }
  return pages.join('\n').replace(/\s+/g, ' ')
}

function extractSignatureNames(text: string) {
  const names = new Set<string>()
  for (const match of text.matchAll(/Berlin,\s+den\s+\d{1,2}\.\s+\S+\s+\d{4}\s+(.{0,1200})/g)) {
    const block = match[1].replace(/\s+(Vorabfassung|Begründung|Gesamtherstellung|Deutscher Bundestag|Drucksache\s+\d+\/).*$/i, '')
    for (const group of block.matchAll(/(.+?)\s+und\s+Fraktion/g)) {
      for (const name of group[1].split(',').map((part) => part.trim()).filter(Boolean)) names.add(name)
    }
  }
  return [...names]
}

function resolveMember(name: string, parties: Set<string>, date: string) {
  const candidates = (membersByName.get(normalizeName(name)) ?? []).filter((member) =>
    parties.has(member.party)
    && member.validFrom <= date
    && (!member.validTo || date <= member.validTo)
  )
  return candidates.length === 1 ? candidates[0] : null
}

function normalizeName(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .toLowerCase()
    .replace(/\b(prof|dr|rer|nat|jur|med|h|c)\b\.?/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function maxDate(a: string, b: string) {
  return a > b ? a : b
}
