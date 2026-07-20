import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

type ExtractedProtocol = {
  number: string
  votes?: Array<{
    index: number
    id?: string
    title: string
    vote_type: string
  }>
}

export function readHandzeichenTitleSources() {
  const dir = fileURLToPath(new URL('../etl/bundestag/handzeichen/extracted/', import.meta.url))
  const sources = new Map<string, string>()
  for (const file of readdirSync(dir).filter((name) => name.endsWith('.json'))) {
    const data = JSON.parse(readFileSync(join(dir, file), 'utf8')) as ExtractedProtocol
    for (const vote of data.votes ?? []) {
      if (vote.vote_type === 'handzeichen') sources.set(vote.id ?? `pp${data.number.replace('/', '-')}-${vote.index}-${slugify(vote.title)}`, vote.title)
    }
  }
  return sources
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}
