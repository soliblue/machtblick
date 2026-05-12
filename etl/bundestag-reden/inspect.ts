import { DuckDBInstance } from '@duckdb/node-api'

const PARQUET = new URL('./raw/CPP-BT_2026-01-17_DE_PQT_Reden_Gesamt.parquet', import.meta.url).pathname

const instance = await DuckDBInstance.create(':memory:')
const conn = await instance.connect()

const describe = await conn.runAndReadAll(`DESCRIBE SELECT * FROM read_parquet('${PARQUET}')`)
console.log('=== Schema ===')
for (const row of describe.getRowObjects()) {
  console.log(`  ${row.column_name}\t${row.column_type}`)
}

const total = await conn.runAndReadAll(`SELECT count(*) AS n FROM read_parquet('${PARQUET}')`)
console.log('\n=== Row counts ===')
console.log('total:', total.getRowObjects()[0].n)

const wpCol = await detectWahlperiodeColumn(conn, PARQUET)
console.log('wahlperiode column:', wpCol)

const wp21 = await conn.runAndReadAll(`SELECT count(*) AS n FROM read_parquet('${PARQUET}') WHERE ${wpCol} = 21`)
console.log('wp=21:', wp21.getRowObjects()[0].n)

const dateCol = await detectDateColumn(conn, PARQUET)
console.log('date column:', dateCol)

const range = await conn.runAndReadAll(`SELECT min(${dateCol}) AS min_d, max(${dateCol}) AS max_d FROM read_parquet('${PARQUET}') WHERE ${wpCol} = 21`)
console.log('wp=21 date range:', range.getRowObjects()[0])

console.log('\n=== Sample row (first wp=21 speech) ===')
const first = await conn.runAndReadAll(`SELECT * FROM read_parquet('${PARQUET}') WHERE ${wpCol} = 21 ORDER BY ${dateCol} ASC LIMIT 1`)
printRow(first.getRowObjects()[0])

console.log('\n=== Sample row (latest wp=21 speech) ===')
const last = await conn.runAndReadAll(`SELECT * FROM read_parquet('${PARQUET}') WHERE ${wpCol} = 21 ORDER BY ${dateCol} DESC LIMIT 1`)
printRow(last.getRowObjects()[0])

const cols = describe.getRowObjects().map((r) => String(r.column_name))
for (const col of ['redner_fraktion', 'redner_rolle_kurz', 'redner_rolle_lang', 'dokumentart', 'berichtart']) {
  if (!cols.includes(col)) continue
  console.log(`\n=== Distinct ${col} (wp=21) ===`)
  const d = await conn.runAndReadAll(`SELECT ${col} AS v, count(*) AS n FROM read_parquet('${PARQUET}') WHERE ${wpCol} = 21 GROUP BY ${col} ORDER BY n DESC LIMIT 40`)
  for (const row of d.getRowObjects()) console.log(`  ${String(row.v).padEnd(40)} ${row.n}`)
}

async function detectWahlperiodeColumn(conn: Awaited<ReturnType<DuckDBInstance['connect']>>, p: string) {
  const d = await conn.runAndReadAll(`DESCRIBE SELECT * FROM read_parquet('${p}')`)
  const names = d.getRowObjects().map((r) => String(r.column_name))
  for (const c of ['Wahlperiode', 'WP', 'wahlperiode', 'wp']) if (names.includes(c)) return c
  throw new Error('no wahlperiode column found in: ' + names.join(','))
}

async function detectDateColumn(conn: Awaited<ReturnType<DuckDBInstance['connect']>>, p: string) {
  const d = await conn.runAndReadAll(`DESCRIBE SELECT * FROM read_parquet('${p}')`)
  const names = d.getRowObjects().map((r) => String(r.column_name))
  for (const c of ['sitzung_datum', 'Datum', 'Date', 'datum', 'Sitzungsdatum']) if (names.includes(c)) return c
  throw new Error('no date column found in: ' + names.join(','))
}

function printRow(row: Record<string, unknown>) {
  for (const [k, v] of Object.entries(row)) {
    const s = v == null ? 'null' : typeof v === 'string' ? v.length > 200 ? v.slice(0, 200) + ` ... [${v.length} chars total]` : v : String(v)
    console.log(`  ${k}: ${s}`)
  }
}
