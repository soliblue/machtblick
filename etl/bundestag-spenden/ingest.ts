import { createHash } from 'node:crypto'
import { writeFile, mkdir } from 'node:fs/promises'
import * as cheerio from 'cheerio'
import { db } from '@machtblick/db/client'
import { partyDonations } from '@machtblick/db/schema'
import { normalizeParty } from './parties.js'

const INDEX_URL = 'https://www.bundestag.de/parlament/praesidium/parteienfinanzierung/fundstellen50000'
const PERIOD_START = '2025-03-25'
const YEARS = [2025, 2026]
const RAW_DIR = new URL('./raw/', import.meta.url).pathname

await mkdir(RAW_DIR, { recursive: true })

const unknownParties = new Map<string, number>()
const rows: typeof partyDonations.$inferInsert[] = []

for (const year of YEARS) {
  const url = `${INDEX_URL}/${year}`
  const html = await fetch(url, { headers: { 'user-agent': 'machtblick/etl' } }).then((r) => r.text())
  await writeFile(`${RAW_DIR}${year}.html`, html)
  const $ = cheerio.load(html)
  const table = $('table.table').first()
  table.find('tr').each((_, tr) => {
    const cells = $(tr).find('td')
    if (cells.length !== 5) return
    const partyRaw = cleanText($(cells[0]).text())
    const amountRaw = cleanText($(cells[1]).text())
    const donorCell = cellLines($, cells[2])
    const receivedRaw = cleanText($(cells[3]).text())
    const notifiedRaw = cleanText($(cells[4]).text())
    const party = normalizeParty(partyRaw)
    if (!party) {
      unknownParties.set(partyRaw, (unknownParties.get(partyRaw) ?? 0) + 1)
      return
    }
    const amountEur = parseAmount(amountRaw)
    const dateReceived = parseDate(receivedRaw)
    const dateNotified = parseDate(notifiedRaw)
    if (dateReceived < PERIOD_START) return
    const donor = donorCell[0] ?? ''
    const donorAddress = donorCell.slice(1).join(', ') || null
    const id = createHash('sha1').update(`${party}|${donor}|${dateReceived}|${amountEur}`).digest('hex').slice(0, 16)
    rows.push({ id, party, donor, donorAddress, amountEur, dateReceived, dateNotified, sourceUrl: url })
  })
}

const inserted = db.transaction((tx) => {
  let n = 0
  for (const row of rows) {
    const r = tx.insert(partyDonations).values(row).onConflictDoUpdate({
      target: partyDonations.id,
      set: {
        party: row.party,
        donor: row.donor,
        donorAddress: row.donorAddress,
        amountEur: row.amountEur,
        dateReceived: row.dateReceived,
        dateNotified: row.dateNotified,
        sourceUrl: row.sourceUrl,
      },
    }).run()
    n += r.changes
  }
  return n
})

const totals = new Map<string, { count: number; sum: number }>()
for (const r of rows) {
  const t = totals.get(r.party) ?? { count: 0, sum: 0 }
  t.count++
  t.sum += r.amountEur
  totals.set(r.party, t)
}

console.log(`donations ingested: ${rows.length} (db changes: ${inserted})`)
console.log('\nper party:')
for (const [party, t] of [...totals.entries()].sort((a, b) => b[1].sum - a[1].sum)) {
  console.log(`  ${party.padEnd(14)} ${String(t.count).padStart(3)} · ${t.sum.toLocaleString('de-DE')} €`)
}
if (unknownParties.size > 0) {
  console.log('\nunknown party labels (not inserted):')
  for (const [name, n] of unknownParties) console.log(`  ${name} (${n})`)
}

function cleanText(s: string) {
  return s.replace(/ /g, ' ').replace(/\s+/g, ' ').trim()
}

function cellLines($: cheerio.CheerioAPI, el: any) {
  const html = $(el).find('p').first().html() ?? $(el).html() ?? ''
  return html
    .split(/<br\s*\/?>/i)
    .map((chunk) => cleanText(cheerio.load(chunk).text()))
    .filter(Boolean)
}

function parseAmount(s: string) {
  const m = s.match(/([\d.]+)(?:,(\d{2}))?/)
  if (!m) throw new Error(`amount unparseable: ${s}`)
  return Number(m[1].replace(/\./g, ''))
}

function parseDate(s: string) {
  const full = s.match(/(\d{1,2})\.(\d{2})\.(\d{4})/g)
  if (full) {
    const last = full[full.length - 1].match(/(\d{1,2})\.(\d{2})\.(\d{4})/)!
    return `${last[3]}-${last[2]}-${last[1].padStart(2, '0')}`
  }
  const split = s.match(/(\d{1,2})\.(\d{2})\.?\s*(\d{4})/)
  if (split) return `${split[3]}-${split[2]}-${split[1].padStart(2, '0')}`
  throw new Error(`date unparseable: ${s}`)
}
