import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const sessions = new Map()
const pinnedDrucksachen = JSON.parse(readFileSync(fileURLToPath(new URL('./source-overrides.json', import.meta.url)), 'utf8'))

function source(id) {
  const match = id.match(/^pp(\d+)-(\d+)-(\d+)-/)
  if (!match) return null
  const session = `${match[1]}-${match[2]}`
  const path = fileURLToPath(new URL(`./extracted/${session}.json`, import.meta.url))
  if (!existsSync(path)) return null
  if (!sessions.has(session)) sessions.set(session, JSON.parse(readFileSync(path, 'utf8')))
  const data = sessions.get(session)
  return {
    block: data.blocks?.[Number(match[3])]?.block ?? null,
  }
}

export const handzeichenSourceBlock = (id) => source(id)?.block ?? null
export const pinnedSourceDrucksache = (id) => pinnedDrucksachen[id] ?? null
