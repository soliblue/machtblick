import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, fsyncSync, openSync, closeSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), 'cache')

const dir = (endpoint: string) => join(ROOT, endpoint)

const ensure = (endpoint: string) => {
  const d = dir(endpoint)
  if (!existsSync(d)) mkdirSync(d, { recursive: true })
  return d
}

const pageName = (n: number) => `page-${String(n).padStart(5, '0')}.json`

export function listPages(endpoint: string) {
  const d = ensure(endpoint)
  return readdirSync(d).filter((f) => f.startsWith('page-') && f.endsWith('.json')).sort()
}

export function nextPageNumber(endpoint: string) {
  return listPages(endpoint).length + 1
}

export function writePage(endpoint: string, pageNum: number, json: unknown) {
  const d = ensure(endpoint)
  const path = join(d, pageName(pageNum))
  const fd = openSync(path, 'w')
  writeFileSync(fd, JSON.stringify(json))
  fsyncSync(fd)
  closeSync(fd)
}

const cursorPath = (endpoint: string) => join(ensure(endpoint), '_cursor.txt')
const donePath = (endpoint: string) => join(ensure(endpoint), '_done')

export function readCursor(endpoint: string) {
  const p = cursorPath(endpoint)
  return existsSync(p) ? readFileSync(p, 'utf8') : ''
}

export function writeCursor(endpoint: string, cursor: string) {
  const fd = openSync(cursorPath(endpoint), 'w')
  writeFileSync(fd, cursor)
  fsyncSync(fd)
  closeSync(fd)
}

export function markDone(endpoint: string) {
  writeFileSync(donePath(endpoint), new Date().toISOString())
}

export function isDone(endpoint: string) {
  return existsSync(donePath(endpoint))
}

export function* readAllPages<T>(endpoint: string): Generator<T> {
  for (const file of listPages(endpoint)) {
    const env = JSON.parse(readFileSync(join(dir(endpoint), file), 'utf8')) as { documents?: T[] }
    for (const doc of env.documents ?? []) yield doc
  }
}
