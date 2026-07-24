import Database from 'better-sqlite3'
import { fileURLToPath } from 'node:url'
import { extractDrucksachen, readDrucksacheCache, underlyingTitleFromCache } from '../polarity/rule.mjs'
import { pLimit } from '../polarity/limit.mjs'
import { cleanTitleWithLLM } from './llm.mjs'
import { argValue } from '../../_shared/worker.mjs'
import { pinnedSourceDrucksache } from '../handzeichen/source.mjs'

const DB_PATH = fileURLToPath(new URL('../../../db/machtblick.sqlite', import.meta.url))
const args = new Set(process.argv.slice(2))
const dryRun = args.has('--dry-run')
const force = args.has('--force')
const voteFilter = argValue('--vote')
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

const SAMMEL_RE = /^(?:Sammelübersicht\s+(\d+)\s+zu\s+Petitionen|Petitionsausschuss\s+Sammelübersicht\s+(\d+))/i

const sammelNumber = (title) => {
  const m = title.match(SAMMEL_RE)
  return m ? (m[1] ?? m[2]) : null
}

const db = new Database(DB_PATH)
const whereClean = force ? '' : 'AND v.clean_title IS NULL'
const rows = db.prepare(`
  SELECT v.id, v.title, v.document, v.summary_simplified, v.inverted, v.is_petition_bundle,
    v.procedural, v.vote_type, v.clean_title, p.rewritten_title
  FROM votes v
  LEFT JOIN vote_polarity_decisions p ON p.vote_id = v.id
  WHERE (? IS NULL OR v.id = ?)
    ${whereClean}
`).all(voteFilter, voteFilter)

const work = sampleLimit ? rows.slice(0, sampleLimit) : rows

console.log(`titles: ${rows.length} candidate rows; processing ${work.length}${dryRun ? ' (dry-run)' : ''}`)

const update = db.prepare(`UPDATE votes SET clean_title = ? WHERE id = ?`)

async function resolveDrucksacheTitle(row) {
  const dnrs = extractDrucksachen(row.document)
  const pinned = pinnedSourceDrucksache(row.id)
  const ordered = pinned ? [pinned, ...dnrs.filter((dnr) => dnr !== pinned)] : dnrs
  for (const d of ordered) {
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
let direct = 0

function displaySourceTitle(row) {
  return row.inverted && row.rewritten_title ? row.rewritten_title : row.title
}

const tasks = work.map((row) =>
  limit(async () => {
    if (row.procedural || row.vote_type === 'hammelsprung') {
      return { row, result: { clean_title: displaySourceTitle(row), confidence: 'high', direct: true } }
    }
    const drucksacheTitle = await resolveDrucksacheTitle(row)
    const nnn = sammelNumber(row.title)
    const sourceTitle = displaySourceTitle(row)
    try {
      const needsLLM = force || row.inverted || row.is_petition_bundle || isVacuous(row.title) || isVacuous(sourceTitle) || drucksacheTitle
      const result = needsLLM
        ? await cleanTitleWithLLM({
            title: row.title,
            document: row.document,
            summary: row.summary_simplified,
            drucksacheTitle,
            polarityTitle: row.inverted ? row.rewritten_title : null,
            isSammelubersicht: nnn !== null,
          })
        : { clean_title: sourceTitle, confidence: 'high', direct: true }
      if (nnn !== null && result.clean_title) {
        const combined = `Sammelübersicht ${nnn}: ${result.clean_title}`
        result.clean_title = combined.length > 90 ? combined.slice(0, 89) + '…' : combined
      }
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
    if (row.clean_title) {
      lowSkipped++
      continue
    }
    result.clean_title = displaySourceTitle(row)
  }
  if (!result.clean_title && result.confidence !== 'low') result.clean_title = displaySourceTitle(row)
  if (!result.clean_title) {
    nulled++
    continue
  }
  update.run(result.clean_title, row.id)
  if (result.direct) direct++
  written++
}

console.log(`done. processed=${work.length} written=${written} direct=${direct} kept_original=${nulled} low_skipped=${lowSkipped} failed=${failed}`)
db.close()
