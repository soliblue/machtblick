import { readFile, writeFile, mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const SEED_PATH = `${process.env.HOME}/Desktop/CODING/German-Politics/app/src/apps/bundestag/votes/data/seed.ts`
const UPDATED_AT = '2026-05-10T14:12:04.423Z'

function stripTypes(source) {
  const lines = source.split('\n')
  const output = []
  let depth = 0
  let inType = false
  for (const line of lines) {
    if (!inType && line.startsWith('export type ')) {
      inType = true
      depth = 0
      for (const ch of line) {
        if (ch === '{') depth++
        if (ch === '}') depth--
      }
      if (!line.includes('{') || depth === 0) inType = false
      continue
    }
    if (inType) {
      for (const ch of line) {
        if (ch === '{') depth++
        if (ch === '}') depth--
      }
      if (depth <= 0) inType = false
      continue
    }
    output.push(line)
  }
  return output.join('\n')
}

export async function loadSeed() {
  const raw = await readFile(SEED_PATH, 'utf8')
  const stripped = stripTypes(raw)
    .replace(/^import \{ voteDataUpdatedAt \} from '~\/platform\/data\/freshness'\n/, '')
    .replace(/export const votesUpdatedAt = voteDataUpdatedAt/, `export const votesUpdatedAt = '${UPDATED_AT}'`)
    .replace(/: RollCallVote\[\]/, '')
  const dir = await mkdtemp(join(tmpdir(), 'machtblick-seed-'))
  const file = join(dir, 'seed.mjs')
  await writeFile(file, stripped)
  return import(pathToFileURL(file).href)
}
