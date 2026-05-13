import Database from 'better-sqlite3'
import { fileURLToPath } from 'node:url'
import { extractDrucksachen, readDrucksacheCache, underlyingTitleFromCache } from '../polarity/rule.mjs'
import { pLimit } from '../polarity/limit.mjs'
import { cleanTitleWithLLM } from './llm.mjs'

const DB_PATH = fileURLToPath(new URL('../../../db/machtblick.sqlite', import.meta.url))
const args = new Set(process.argv.slice(2))
const dryRun = args.has('--dry-run')
const force = args.has('--force')
const sampleLimit = (() => {
  const arg = process.argv.find((a) => a.startsWith('--limit='))
  return arg ? Number(arg.split('=')[1]) : null
})()

const VACUOUS_PATTERNS = [
  /^(Antrag|Entschließungsantr(ag|äge)|Änderungsantrag|Gesetzentwurf|Beschlussempfehlung|Wahlvorschlag|Wahlvorschläge)\s+(der|des)\s+(Fraktion|Abgeordneten|Bundesregierung|AfD|SPD|CDU|CSU|FDP|Linken|Grünen|Union)/i,
  /^(Antrag|Entschließungsantr(ag|äge)|Änderungsantrag|Gesetzentwurf|Beschlussempfehlung|Wahlvorschlag|Wahlvorschläge)\s+(AfD|SPD|CDU|CSU|FDP|Linke|Grüne|B90|Bündnis|Union)/i,
  /\bzu\s+Drucksachen?\s+\d+\/\d+/i,
  /^Entschließungsantr(ag|äge)\b/i,
  /\((?:zweite|dritte|2\.|3\.)\s+(?:Beratung|Lesung)(?:\s*,\s*Schlussabstimmung)?\)\s*$/i,
  /\((?:Schlussabstimmung|Beschlussempfehlung)\)\s*$/i,
  /\(Zweite\s+und\s+dritte\s+(?:Beratung|Lesung)\)\s*$/i,
  /\(Dritte\s+Beratung\s+und\s+Schlussabstimmung\)\s*$/i,
  /^Schlussabstimmung\s*:/i,
  /\((?:AfD|SPD|CDU|CSU|FDP|B90\/Grüne|B90\/Die\s+Grünen|Bündnis\s+90\/Die\s+Grünen|Die\s+Linke|Linke|Grüne|Union|AfD-Gesetzentwurf|AfD-Änderungsantrag|AfD-Antrag|Beschlussempfehlung)\)\s*$/i,
  /^(AfD|SPD|CDU|CSU|FDP)-(?:Gesetzentwurf|Änderungsantrag|Antrag|Entschließungsantrag)\b/i,
  /^Sammelübersicht\s+\d+\s+zu\s+Petitionen/i,
  /^Petitionsausschuss\s+Sammelübersicht/i,
  /^Verfahrensbeteiligung\s+BVerfG/i,
  /^Genehmigung\s+zur\s+Durchführung\s+eines\s+Strafverfahrens/i,
  /^Beschlussempfehlung\s+zum\s+Streitverfahren\s+vor\s+dem\s+BVerfG/i,
  /^Normenkontrolle\s+zum\s+Bundeshaushalt/i,
  /^Gesetzentwurf\s*:\s*Schlussabstimmung\s*$/i,
  /^Dritte\s+Beratung\s+und\s+Schlussabstimmung\s*$/i,
  /^Gesetzentwurf\s+\(Dritte\s+Beratung/i,
]

const isVacuous = (title) => VACUOUS_PATTERNS.some((re) => re.test(title))

const db = new Database(DB_PATH)
const whereClean = force ? '' : 'AND clean_title IS NULL'
const rows = db.prepare(`
  SELECT id, title, document, summary_simplified
  FROM votes
  WHERE procedural = 0 ${whereClean}
`).all()

const candidates = rows.filter((r) => isVacuous(r.title))
const work = sampleLimit ? candidates.slice(0, sampleLimit) : candidates

console.log(`titles: ${candidates.length} vacuous of ${rows.length} non-procedural rows; processing ${work.length}${dryRun ? ' (dry-run)' : ''}`)

const update = db.prepare(`UPDATE votes SET clean_title = ? WHERE id = ?`)

async function resolveDrucksacheTitle(document) {
  const dnrs = extractDrucksachen(document)
  for (const d of dnrs) {
    const doc = await readDrucksacheCache(d)
    const t = doc ? underlyingTitleFromCache(doc) : null
    if (t) return t
  }
  return null
}

const limit = pLimit(4)
let written = 0
let nulled = 0
let lowSkipped = 0
let failed = 0

const tasks = work.map((row) =>
  limit(async () => {
    const drucksacheTitle = await resolveDrucksacheTitle(row.document)
    try {
      const result = await cleanTitleWithLLM({
        title: row.title,
        summary: row.summary_simplified,
        drucksacheTitle,
      })
      return { row, result }
    } catch (e) {
      failed++
      console.warn(`x ${row.id}: ${e.message}`)
      return null
    }
  }),
)

const outcomes = await Promise.all(tasks)
for (const item of outcomes) {
  if (!item) continue
  const { row, result } = item
  if (dryRun) {
    const arrow = result.clean_title ?? '(null)'
    console.log(`[${result.confidence}] ${row.title}\n  -> ${arrow}\n`)
    continue
  }
  if (result.confidence === 'low') {
    lowSkipped++
    continue
  }
  if (!result.clean_title) {
    nulled++
    continue
  }
  update.run(result.clean_title, row.id)
  written++
}

console.log(`done. processed=${work.length} written=${written} kept_original=${nulled} low_skipped=${lowSkipped} failed=${failed}`)
db.close()
