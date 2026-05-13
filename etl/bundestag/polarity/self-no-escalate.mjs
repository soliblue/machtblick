import Database from 'better-sqlite3'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { applyInversion, defectionSignature } from './apply.mjs'
import { pLimit } from './limit.mjs'

const FRAKTIONEN = new Set(['CDU/CSU', 'B90/Grüne', 'Die Linke', 'AfD', 'SPD', 'FDP', 'BSW'])

const db = new Database(fileURLToPath(new URL('../../../db/machtblick.sqlite', import.meta.url)))

const candidates = db.prepare(`
  SELECT v.id, v.title, v.document, v.result, v.yes, v.no, v.vote_type, v.initiator
  FROM votes v
  JOIN vote_party_summaries s ON s.vote_id = v.id AND s.party = v.initiator
  WHERE v.procedural = 0
    AND v.inverted = 0
    AND v.initiator IS NOT NULL
    AND s.position = 'no'
`).all().filter((r) => FRAKTIONEN.has(r.initiator))

console.log(`self-no escalate: ${candidates.length} candidates`)

const PROMPT = `Du bist Experte für parlamentarische Verfahren des Deutschen Bundestags.

Kontext: In dieser Abstimmung stimmte die antragstellende Fraktion mit NEIN gegen ihren eigenen Antrag. Das ist ein starker Hinweis darauf, dass der Bundestag NICHT direkt über die Annahme des Antrags abgestimmt hat, sondern über eine BESCHLUSSEMPFEHLUNG ZUR ABLEHNUNG des Antrags (Buchstabe b). In einem solchen Fall bedeutet "Ja" = "Ja, ablehnen", und die Antragsteller stimmen logisch mit Nein.

Wenn das hier zutrifft (also: invertierte Abstimmungsform vorlag), soll die Polarität gespiegelt werden, ohne den Titel zu ändern (der Titel ist bereits sachlich der Antragstitel).

Eingabe:
Titel (bereits sachlich formuliert): __TITLE__
Dokument-Teaser: __DOCUMENT__
Antragstellende Fraktion: __PROPOSER__
Fraktionspositionen: __POSITIONS__
Berichtetes Ergebnis: __RESULT__

Antworte AUSSCHLIESSLICH als JSON-Objekt:
{"inverted": boolean, "confidence": "high"|"medium"|"low", "reason": "kurzer deutscher Satz"}

Regeln:
- inverted=true wenn die Abstimmungsform plausibel eine Beschlussempfehlung zur Ablehnung war (Indizien: Antragsteller stimmt Nein; Koalition stimmt Ja; Ergebnis "angenommen" trotz Oppositions-Antrag; oder Dokument verweist auf eine Beschlussempfehlungs-Drucksache).
- inverted=false wenn es plausible Alternativerklärungen gibt (z.B. der Antrag wurde im Laufe des Verfahrens geändert, der Antragsteller distanzierte sich, oder es war eine reine Fraktions-Strategie).
- Bei confidence=low wird KEINE Inversion vorgenommen.`

function runClaude(prompt) {
  return new Promise((resolve, reject) => {
    const c = spawn('claude', ['-p', '--model', 'sonnet', '--output-format', 'json'], { stdio: ['pipe', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    c.stdout.on('data', (d) => (stdout += d))
    c.stderr.on('data', (d) => (stderr += d))
    c.on('close', (code) => {
      if (code !== 0) return reject(new Error(`claude exit ${code}: ${stderr}`))
      resolve(stdout)
    })
    c.stdin.write(prompt)
    c.stdin.end()
  })
}

function parseLlm(raw) {
  const env = JSON.parse(raw)
  const text = typeof env.result === 'string' ? env.result : JSON.stringify(env.result ?? env)
  const m = text.match(/\{[\s\S]*\}/)
  if (!m) throw new Error(`no JSON in claude output: ${text.slice(0, 200)}`)
  const obj = JSON.parse(m[0])
  return {
    inverted: obj.inverted === true,
    confidence: ['high', 'medium', 'low'].includes(obj.confidence) ? obj.confidence : 'low',
    reason: typeof obj.reason === 'string' ? obj.reason : '',
  }
}

const limit = pLimit(4)
const tasks = candidates.map((row) =>
  limit(async () => {
    const positions = db.prepare(`SELECT party, position FROM vote_party_summaries WHERE vote_id = ? ORDER BY party`).all(row.id)
    const posLine = positions.map((p) => `${p.party}=${p.position}`).join(', ')
    const prompt = PROMPT
      .replace('__TITLE__', row.title)
      .replace('__DOCUMENT__', row.document ?? '(nicht vorhanden)')
      .replace('__PROPOSER__', row.initiator)
      .replace('__POSITIONS__', posLine)
      .replace('__RESULT__', row.result)
    const raw = await runClaude(prompt)
    const result = parseLlm(raw)
    return { row, result }
  }),
)

const outcomes = await Promise.all(tasks)

let inverted = 0
let skipped = 0
const skippedRows = []
for (const { row, result } of outcomes) {
  if (!result.inverted || result.confidence === 'low') {
    skipped++
    skippedRows.push({ id: row.id, initiator: row.initiator, reason: result.reason, confidence: result.confidence })
    continue
  }
  const before = defectionSignature(db, row.id)
  applyInversion(db, row, { rewrittenTitle: row.title, source: 'llm-self-no', confidence: result.confidence, reason: result.reason })
  const after = defectionSignature(db, row.id)
  if (before !== after) console.warn(`⚠ defection signature changed for ${row.id}: ${before} → ${after}`)
  inverted++
}

console.log(`self-no escalate: inverted=${inverted} skipped=${skipped}`)
if (skipped > 0 && process.argv.includes('--verbose')) {
  console.log('skipped:')
  for (const r of skippedRows) console.log(`  ${r.id} initiator=${r.initiator} confidence=${r.confidence} reason=${r.reason}`)
}
db.close()
