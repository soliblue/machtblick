import { createHash } from 'node:crypto'
import { writeFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as cheerio from 'cheerio'
import { eq } from 'drizzle-orm'
import { partyDonations } from '@machtblick/db/schema'
import { normalizeParty } from '../_shared/parties.ts'

const INDEX_URL = 'https://www.bundestag.de/parlament/praesidium/parteienfinanzierung/fundstellen50000'
const PERIOD_START = '2025-03-25'
const YEARS = [2025, 2026]
const RAW_DIR = new URL('./raw/', import.meta.url).pathname

type DonationScopeRow = {
  id: string
  dateReceived: string
  sourceUrl: string
}

export function staleDonationIds(existingRows: DonationScopeRow[], sourceRows: DonationScopeRow[]) {
  const sourceUrls = new Set(YEARS.map((year) => `${INDEX_URL}/${year}`))
  const incompleteSourceUrl = [...sourceUrls].find((sourceUrl) => !sourceRows.some((row) => row.sourceUrl === sourceUrl))
  if (incompleteSourceUrl) throw new Error(`donation source yielded no rows: ${incompleteSourceUrl}`)
  const sourceIds = new Set(sourceRows.map((row) => row.id))
  if (sourceIds.size !== sourceRows.length) throw new Error('donation source yielded duplicate rows')
  for (const sourceUrl of sourceUrls) {
    const existingSourceRows = existingRows.filter((row) => row.dateReceived >= PERIOD_START && row.sourceUrl === sourceUrl)
    const fetchedSourceRows = sourceRows.filter((row) => row.dateReceived >= PERIOD_START && row.sourceUrl === sourceUrl)
    if (fetchedSourceRows.length < Math.ceil(existingSourceRows.length * 0.9)) {
      throw new Error(`donation source row count collapsed for ${sourceUrl}: ${fetchedSourceRows.length} fetched, ${existingSourceRows.length} existing`)
    }
  }
  return existingRows
    .filter((row) => row.dateReceived >= PERIOD_START && sourceUrls.has(row.sourceUrl) && !sourceIds.has(row.id))
    .map((row) => row.id)
}

export function validateDonationRowCellCount(cellCount: number) {
  if (cellCount > 0 && cellCount !== 5) throw new Error(`donation source row has ${cellCount} data cells, expected 5`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await mkdir(RAW_DIR, { recursive: true })

  const unknownParties = new Map<string, number>()
  const rows: typeof partyDonations.$inferInsert[] = []

  for (const year of YEARS) {
    const url = `${INDEX_URL}/${year}`
    const response = await fetch(url, { headers: { 'user-agent': 'machtblick/etl' } })
    if (!response.ok) throw new Error(`donation source ${url} returned ${response.status}`)
    const html = await response.text()
    await writeFile(`${RAW_DIR}${year}.html`, html)
    const $ = cheerio.load(html)
    const table = $('table.table').first()
    if (table.length === 0) throw new Error(`donation source ${url} has no table`)
    table.find('tr').each((_, tr) => {
      const cells = $(tr).find('td')
      validateDonationRowCellCount(cells.length)
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

  if (unknownParties.size > 0) {
    console.log('\nunknown party labels (not inserted):')
    for (const [name, n] of unknownParties) console.log(`  ${name} (${n})`)
    throw new Error('unknown party labels block donation reconciliation')
  }

  const { db } = await import('@machtblick/db/client')
  const result = db.transaction((tx) => {
    const staleIds = staleDonationIds(
      tx.select({ id: partyDonations.id, dateReceived: partyDonations.dateReceived, sourceUrl: partyDonations.sourceUrl }).from(partyDonations).all(),
      rows,
    )
    let changes = 0
    for (const row of rows) {
      changes += tx.insert(partyDonations).values(row).onConflictDoUpdate({
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
      }).run().changes
    }
    for (const id of staleIds) changes += tx.delete(partyDonations).where(eq(partyDonations.id, id)).run().changes
    return { changes, removed: staleIds.length }
  })

  const totals = new Map<string, { count: number; sum: number }>()
  for (const row of rows) {
    const total = totals.get(row.party) ?? { count: 0, sum: 0 }
    total.count++
    total.sum += row.amountEur
    totals.set(row.party, total)
  }

  console.log(`donations ingested: ${rows.length} (db changes: ${result.changes}, stale removed: ${result.removed})`)
  console.log('\nper party:')
  for (const [party, total] of [...totals.entries()].sort((a, b) => b[1].sum - a[1].sum)) {
    console.log(`  ${party.padEnd(14)} ${String(total.count).padStart(3)} · ${total.sum.toLocaleString('de-DE')} €`)
  }
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
