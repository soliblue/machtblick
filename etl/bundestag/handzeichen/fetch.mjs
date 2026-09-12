import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join, resolve } from 'node:path'
import { dipList } from '../../dip/client.ts'
import { hasProtocolText } from './protocolSource.mjs'

const OUT = new URL('./raw/', import.meta.url).pathname

function isProtocolDocument(document) {
  return typeof document?.id === 'string'
    && document.dokumentart === 'Plenarprotokoll'
    && document.typ === 'Dokument'
    && /^21\/\d+$/.test(document.dokumentnummer)
    && document.wahlperiode === 21
    && document.herausgeber === 'BT'
}

export function protocolDocuments(response) {
  if (!Number.isInteger(response?.numFound)
    || !Array.isArray(response.documents)
    || response.documents.length === 0
    || response.numFound < response.documents.length
    || response.documents.some((document) => !isProtocolDocument(document))) {
    throw new Error('invalid DIP protocol list response')
  }
  return response.documents
}

export function protocolXml(document, expected) {
  if (!isProtocolDocument(document)
    || !isProtocolDocument(expected)
    || document.id !== expected.id
    || document.dokumentnummer !== expected.dokumentnummer
    || (document.text != null && typeof document.text !== 'string')) {
    throw new Error(`invalid DIP protocol detail for ${expected?.dokumentnummer ?? 'unknown protocol'}`)
  }
  return document.text?.trim()
    ? `<?xml version='1.0' encoding='UTF-8'?>\n<document>\n${Object.entries(document).map(([key, value]) => xmlNodes(key, value)).join('')}</document>\n`
    : null
}

function xmlNodes(key, value) {
  if (Array.isArray(value)) return value.map((item) => xmlNodes(key, item)).join('')
  if (value && typeof value === 'object') return `<${key}>${Object.entries(value).map(([childKey, childValue]) => xmlNodes(childKey, childValue)).join('')}</${key}>\n`
  return value == null ? '' : `  <${key}>${String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;')}</${key}>\n`
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await mkdir(OUT, { recursive: true })
  const existing = new Set((await readdir(OUT)).map((file) => file.replace(/\.xml$/, '')))
  const list = await dipList('/plenarprotokoll', { 'f.wahlperiode': '21', 'f.zuordnung': 'BT', format: 'json' })
  console.log(`api lists ${list.numFound} protocols`)

  for (const doc of protocolDocuments(list)) {
    const key = doc.dokumentnummer.replace('/', '-')
    const path = join(OUT, `${key}.xml`)
    if (existing.has(key) && hasProtocolText(await readFile(path, 'utf8'))) continue
    const xml = protocolXml(await dipList(`/plenarprotokoll-text/${doc.id}`, { format: 'json' }), doc)
    if (!xml) {
      console.log(`skipped incomplete ${doc.dokumentnummer} (${doc.datum})`)
      continue
    }
    await writeFile(path, xml)
    console.log(`${existing.has(key) ? 'refetched' : 'fetched'} ${doc.dokumentnummer} (${doc.datum})`)
  }
}
